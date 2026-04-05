import cv2
import numpy as np

from skimage import transform as trans

def adjust_src_pts(src_pts):
    if src_pts[2][1] > src_pts[1][1] and src_pts[2][1] > src_pts[0][1]:
        return src_pts
    # up-side down
    if src_pts[2][1] < src_pts[1][1] and src_pts[2][1] < src_pts[0][1]:
        if src_pts[0][0] < src_pts[1][0]:
            src_pts[[0, 1]] = src_pts[[1, 0]]
    # right
    if src_pts[2][0] > src_pts[1][0] and src_pts[2][0] > src_pts[0][0]:
        if src_pts[0][1] < src_pts[1][1]:
            src_pts[[0, 1]] = src_pts[[1, 0]]
    # left
    if src_pts[2][0] < src_pts[1][0] and src_pts[2][0] < src_pts[0][0]:
        if src_pts[0][1] > src_pts[1][1]:
            src_pts[[0, 1]] = src_pts[[1, 0]]
    return src_pts

def preprocess(img, bbox=None, landmark=None, src_pts_type='ori', **kwargs):
    if isinstance(img, str):
        img = read_image(img, **kwargs)
    M = None
    image_size = []
    str_image_size = kwargs.get('image_size', '')
    if len(str_image_size) > 0:
        image_size = [int(x) for x in str_image_size.split(',')]
        if len(image_size) == 1:
            image_size = [image_size[0], image_size[0]]
        scaler = image_size[0] / 224
        assert len(image_size) == 2
    if landmark is not None:
        assert len(image_size) == 2
        
        if src_pts_type == 'ori':
            ref_left_eye  = [64.9364, 87.3926]
            ref_right_eye = [159.0636, 87.0028]
            ref_nose      = [110.0504, 143.4732]
        elif src_pts_type == 'petface':
            # pet face src pts
            ref_left_eye  = [56.,  94.75487264]
            ref_right_eye = [168., 94.57845561]
            ref_nose      = [112.2124176, 150.36327108]
        
        src = np.array([
            ref_left_eye,
            ref_right_eye,
            ref_nose], dtype=np.float32) * scaler
        dst = landmark.astype(np.float32)
        
        tform = trans.SimilarityTransform()
        tform.estimate(dst, src)
        M = tform.params[0:2, :]
        # M = cv2.estimateRigidTransform( dst.reshape(1,5,2), src.reshape(1,5,2), False)

    if M is None:
        if bbox is None:  # use center crop
            det = np.zeros(4, dtype=np.int32)
            det[0] = int(img.shape[1] * 0.0625)
            det[1] = int(img.shape[0] * 0.0625)
            det[2] = img.shape[1] - det[0]
            det[3] = img.shape[0] - det[1]
        else:
            det = bbox
        margin = kwargs.get('margin', 20)
        bb = np.zeros(4, dtype=np.int32)
        bb[0] = np.maximum(det[0] - margin / 2, 0)
        bb[1] = np.maximum(det[1] - margin / 2, 0)
        bb[2] = np.minimum(det[2] + margin / 2, img.shape[1])
        bb[3] = np.minimum(det[3] + margin / 2, img.shape[0])
        ret = img[bb[1]:bb[3], bb[0]:bb[2], :]
        if len(image_size) > 0:
            ret = cv2.resize(ret, (image_size[1], image_size[0]))
        return ret
    else:  # do align using landmark
        assert len(image_size) == 2

        warped = cv2.warpAffine(img, M, (image_size[1], image_size[0]), borderValue=0.0)
        return warped

if __name__ == "__main__":
    pass
