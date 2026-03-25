from PIL import Image
import cv2
import numpy as np
from KAMFace import kam_face_model
from KAMFace import face_alignmnet as fa
from KAMFace import iresnet
from torch import nn
import torch
from ultralytics import YOLO
from torchvision.transforms import Compose, Normalize, RandomHorizontalFlip, ToTensor, Resize

class KAMFacePipeline:
    def __init__(
        self,
        yolo_body_detector_path,
        yolo_face_detector_path,
        pet_face_backbone_path,
        device='cuda'
    ):
        self.device = device
        
        self.yolo_body_detector = YOLO(yolo_body_detector_path)
        self.yolo_body_detector = self.yolo_body_detector.to(device)
        
        self.yolo_face_detector = YOLO(yolo_face_detector_path)
        self.yolo_face_detector = self.yolo_face_detector.to(device)

        self.backbone = kam_face_model.PetFaceRecognitionBackbone(backbone_type='resnet', pretrained=True)
        self.backbone.load_state_dict(torch.load(pet_face_backbone_path, map_location=device))
        self.backbone = self.backbone.to(device)
        self.backbone.eval()

        normalize = Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
        self.transform = Compose([
            Resize((112, 112)),
            ToTensor(),
            normalize
        ])
        
        self.body_transform = Compose([
            Resize((224, 224)),
            ToTensor(),
            normalize
        ])

    def match_faces_to_bodies_vectorized(self, face_kpts, body_boxes, orig_img, img_path):
        """
        face_kpts: (m, 3, 2) ndarray
        body_boxes: (n, 4) ndarray, xyxy
    
        return: list[{'face_kpts': (3,2) ndarray, 'body_bbox': (4,) ndarray or None}]
        """
        face_kpts = np.asarray(face_kpts)
        body_boxes = np.asarray(body_boxes)
    
        m = face_kpts.shape[0]
        n = body_boxes.shape[0]
    
        # 早退：沒有 body 或沒有 face
        if m == 0:
            return []
        if n == 0:
            return [{'face_kpts': face_kpts[i], 'body_bbox': None} for i in range(m)]
    
        # --- 臉部三點的外接矩形 & 質心 ---
        fx = face_kpts[..., 0]               # (m, 3)
        fy = face_kpts[..., 1]               # (m, 3)
        f_xmin = fx.min(axis=1)              # (m,)
        f_xmax = fx.max(axis=1)
        f_ymin = fy.min(axis=1)
        f_ymax = fy.max(axis=1)
        f_centroid = np.stack([fx.mean(axis=1), fy.mean(axis=1)], axis=1)  # (m, 2)
    
        # --- body bbox 的分量、面積、中心 ---
        x1, y1, x2, y2 = body_boxes.T        # (n,), (n,), (n,), (n,)
        # 保守處理：若輸入偶有 x2<x1 或 y2<y1，做一次排序避免負面積
        x1c = np.minimum(x1, x2)
        x2c = np.maximum(x1, x2)
        y1c = np.minimum(y1, y2)
        y2c = np.maximum(y1, y2)
    
        areas = (x2c - x1c) * (y2c - y1c)    # (n,)
        centers = np.stack([(x1c + x2c) / 2.0, (y1c + y2c) / 2.0], axis=1)  # (n, 2)
    
        # --- 建立包含關係 cond: (m, n) ---
        # x1 <= f_xmin <= f_xmax <= x2  AND  y1 <= f_ymin <= f_ymax <= y2
        cond = (
            (x1c[None, :] <= f_xmin[:, None]) &
            (f_xmax[:, None] <= x2c[None, :]) &
            (y1c[None, :] <= f_ymin[:, None]) &
            (f_ymax[:, None] <= y2c[None, :])
        )  # (m, n)
    
        # --- tie-break 所需距離矩陣 d^2: (m, n) ---
        # 將 (m,2) 與 (n,2) 擴成 (m,n,2) 再算平方距離
        dx = centers[None, :, 0] - f_centroid[:, None, 0]
        dy = centers[None, :, 1] - f_centroid[:, None, 1]
        d2 = dx * dx + dy * dy  # (m, n)
    
        # --- 先在 cond 上取最小面積 ---
        area_mat = areas[None, :].repeat(m, axis=0)              # (m, n)
        area_masked = np.where(cond, area_mat, np.inf)           # (m, n)
        min_area_per_face = area_masked.min(axis=1)              # (m,)
    
        # --- 在最小面積集合中，取距離最小者 ---
        # 注意浮點數相等用 isclose
        tie_mask = cond & np.isclose(area_mat, min_area_per_face[:, None])  # (m, n)
        d2_masked = np.where(tie_mask, d2, np.inf)                           # (m, n)
        best_idx_per_face = d2_masked.argmin(axis=1)                         # (m,)
    
        # 若該 face 無任何候選（整行皆為 inf），min_area 為 inf；將索引標為 -1
        valid_face = np.isfinite(min_area_per_face)                           # (m,)
        best_idx_per_face = np.where(valid_face, best_idx_per_face, -1)
    
        # --- 組裝輸出 ---
        results = []
        for i in range(m):
            src_pts = face_kpts[i][[2, 1, 0]] # to left, right, nose
            face_img = fa.preprocess(orig_img, None, src_pts, image_size="224, 224", src_pts_type='petface', margin=0)
            face_img = Image.fromarray(face_img[..., ::-1])
            
            if best_idx_per_face[i] == -1:
                results.append({'face_kpts': face_kpts[i], 'body_bbox': None, 
                                'face_img': face_img, 'body_img': None, 'img_path': img_path})
            else:
                x1, y1, x2, y2 = body_boxes[best_idx_per_face[i]]
                x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                body_img = Image.fromarray(orig_img[y1:y2, x1:x2, ::-1])
                
                results.append({'face_kpts': face_kpts[i], 'body_bbox': body_boxes[best_idx_per_face[i]], 
                                'face_img': face_img, 'body_img': body_img, 'img_path': img_path})
        return results
        
    def detection(
        self,
        img_path,
        conf=0.1,
    ):
        body_res = self.yolo_body_detector(img_path, conf=conf, verbose=False)[0]
        face_res = self.yolo_face_detector(img_path, conf=conf, verbose=False)[0]
        body_boxes = body_res.boxes.xyxy.detach().cpu().numpy()
        face_kpts = face_res.keypoints.xy.detach().cpu().numpy()
        orig_img = face_res.orig_img
        res = self.match_faces_to_bodies_vectorized(face_kpts, body_boxes, orig_img, img_path)
        
        return res

    def __call__(
        self, 
        img_path, 
        conf=0.1
    ):
        res = self.detection(img_path, conf)
        
        for i, r in enumerate(res):
            face_input = self.transform(r['face_img']).unsqueeze(0).to(self.device)
            if r['body_img']:
                body_input = self.body_transform(r['body_img']).unsqueeze(0).to(self.device)
            else:
                body_input = torch.zeros((1, 3, 224, 224)).to(self.device)
                
            kpts = torch.tensor(r['face_kpts'] / 224).unsqueeze(0).to(self.device)
        
            with torch.no_grad():
                emb, _ = self.backbone(body_input, face_input, kpts)
            res[i]['feat'] = emb
            
        return res