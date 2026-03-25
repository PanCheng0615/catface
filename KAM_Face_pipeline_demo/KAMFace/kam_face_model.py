from torch import nn
import torch
from KAMFace import iresnet
import timm
# -------------------------------
# 定義模型
# -------------------------------
class KptsGussianHeatmapModule(nn.Module):
    def __init__(self, in_channels=256, out_channels=512):
        super().__init__()
        # learnable log_sigma for numerical stability
        self.log_sigma = nn.Parameter(torch.rand(3))  # 3 keypoints
        
        self.hm_enc = nn.Sequential(
            nn.Conv2d(3, in_channels, 3, padding=1, bias=False),
            nn.BatchNorm2d(in_channels),
            nn.ReLU(inplace=True)
        )
        
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels * 2, out_channels, 3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def _gaussian(self, kpts, H, W):
        B = kpts.size(0)
        kpts = kpts * H
        device = kpts.device
        yy, xx = torch.meshgrid(torch.arange(H, device=device),
                                torch.arange(W, device=device), indexing='ij')
        xx, yy = xx.float(), yy.float()
        maps = []
        for p in range(3):
            x, y = kpts[:, p, 0:1], kpts[:, p, 1:2]     # (B,1)
            sigma = self.log_sigma[p].exp()             # scalar
            g = torch.exp(-((xx - x.view(B, 1, 1))**2 + (yy - y.view(B, 1, 1))**2) / (2 * sigma**2))
            maps.append(g)
        heat = torch.stack(maps, dim=1)   # (B, 3, H, W)
        return heat / (heat.amax(dim=(-2,-1), keepdim=True)+1e-6)

    def forward(self, feat, norm_kpts):
        # feat: (B, 256, 14, 14) – output of layer3
        B, ch, H, W = feat.shape
        
        heat = self._gaussian(norm_kpts, H, W)
        heat = self.hm_enc(heat)
        x_cat = torch.cat([feat, heat], 1)   
        kpts_feat = self.conv(x_cat)
        return kpts_feat

# --------------------------------------------------------
#     Body backbone
# --------------------------------------------------------

class AlignAdapter(nn.Module):
    """
    Input : layer2 feat  (N,128,28,28)
    Output: align feat   (N,256,28,28) -> cosine loss 對齊 SAM-2
    """
    def __init__(self,
                 in_ch: int = 128,
                 out_ch: int = 256):
        super().__init__()

        self.conv = nn.Sequential(
            nn.Conv2d(in_ch, out_ch, kernel_size=3, stride=1, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_ch, out_ch, kernel_size=3, stride=1, padding=1, bias=False),
            nn.BatchNorm2d(out_ch),
            nn.ReLU(inplace=True),
        )
        
    def forward(self, x):
        """
        x: (N,1024,7,7)
        return: align_feat: (N,256,28,28)  → 對齊損失
        """
        align_feat = self.conv(x)
        return align_feat

class AlignFeatAwareBlock(nn.Module):
    """
    Input : layer3 feat  (N,256,14,14)
            align_feat (N,256,28,28)
    Output: align_aware_feat  → (N,512,7,7)  ──> 和layer4_feat fusion
    """
    def __init__(self):
        super().__init__()

        self.align_feat_conv = nn.Sequential(
            nn.Conv2d(in_channels=256, out_channels=384, kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(384),
            nn.ReLU(inplace=True)
        )
        
        self.conv = nn.Sequential(
            nn.Conv2d(384*2, 768, kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(768),
            nn.ReLU(inplace=True)
        )
        
    def forward(self, layer3_feat, align_feat):
        align_feat = self.align_feat_conv(align_feat)
        
        x_cat = torch.cat([layer3_feat, align_feat], 1)   
        sam2_aware_feat = self.conv(x_cat)
        
        return sam2_aware_feat

class BodyConvNextV2TinyWithAlign(nn.Module):
    def __init__(self, pretrained=True):
        super().__init__()
        # convnextv2_tiny 
        self.backbone = timm.create_model(
            'convnextv2_tiny', pretrained=True,
            features_only=True, out_indices=(1,2,3,))
        
        # adapter
        self.align_adapter = AlignAdapter(in_ch=192, out_ch=256)

        self.align_aware_block = AlignFeatAwareBlock()
        
        # 壓到 512-dim 嵌入（與 face 分支對齊）
        
        self.reduce_fc = nn.Sequential(
            nn.Flatten(),                    # 2048*7*7
            nn.Linear(768*7*7, 512, bias=False),
            nn.BatchNorm1d(512),
            nn.PReLU(512)
        )

        # learnable gate α，用來控制殘差注入強度
        self.alpha = nn.Parameter(torch.tensor(0.4))

    def forward(self, body_img):
        c3, c4, c5 = self.backbone(body_img)

        # branch ── AlignAdapter
        sam_align_feat = self.align_adapter(c3)
    
        adapter_feat = self.align_aware_block(c4, sam_align_feat)

        # ── fuse feat
        fuse_feat = c5 + adapter_feat * self.alpha
        body_feat = self.reduce_fc(fuse_feat)          # (N,512)

        return body_feat, sam_align_feat            # 回傳 512-嵌入 & 對齊用特徵(256,28,28)

class PetFaceRecognitionBackbone(nn.Module):
    def __init__(self, backbone_type='resnet', pretrained=True, embedding_dim=512, feature_dim=512, num_heads=8):
        """
        backbone_type: vit, resnet, convnextv2
        embedding_dim: AdaFace 要求的特徵維度（通常為512）
        """
        super(PetFaceRecognitionBackbone, self).__init__()
        # 載入 ViT 模型，輸入尺寸 224x224，特徵維度一般為768
        if backbone_type == 'vit':
            # not implement yet
            self.face_backbone = create_model('vit_base_patch16_224', pretrained=pretrained)
            self.face_backbone.head = nn.Identity()
        elif backbone_type == 'resnet':
            self.face_backbone = iresnet.iresnet100(num_classes=embedding_dim)
            self.body_backbone = BodyConvNextV2TinyWithAlign()
            
        elif backbone_type == 'convnextv2':
            # not implement yet
            self.face_backbone = ConvNextV2ForImageClassification.from_pretrained("facebook/convnextv2-tiny-22k-224")
            self.face_backbone.classifier = nn.Identity()
            #self.face_bn = torch.nn.BatchNorm1d(embedding_dim, eps=2e-5, momentum=0.9)
        
        self.kp_block = KptsGussianHeatmapModule()
        self.alpha = nn.Parameter(torch.tensor(0.5))

        # freeze 
        self.face_backbone.requires_grad_(False)
        self.kp_block.requires_grad_(False)
        self.alpha.requires_grad_(False)

        self.body_backbone.requires_grad_(False)
        
        # ---------- 融合投影 ----------
        # 仍用 1024 → 512，後接 BN + PReLU
        self.fuse_proj = nn.Sequential(
            nn.Linear(embedding_dim * 2, embedding_dim),
            nn.BatchNorm1d(embedding_dim),
            nn.PReLU(embedding_dim)
        )

        self.backbone_type = backbone_type
        #print('backbone_type:', backbone_type)
    
    def forward(self, body_img, face_img, norm_kpts):        
        #--------------------- get face_feat with kp_block ---------------------
        x = self.face_backbone.conv1(face_img)
        x = self.face_backbone.bn1(x)
        x = self.face_backbone.prelu(x)
        x = self.face_backbone.layer1(x)
        x = self.face_backbone.layer2(x)
        layer3_x = self.face_backbone.layer3(x)
        
        kp_x = self.kp_block(layer3_x, norm_kpts)
        layer4_x = self.face_backbone.layer4(layer3_x)
        
        # get no kpt mask
        no_kpt_mask = (norm_kpts.view(norm_kpts.size(0), -1).abs().sum(dim=1) < 1e-6)
        
        # if no kpt, just use layer4 x only
        fuse_x = layer4_x + kp_x * self.alpha
        fuse_x[no_kpt_mask] = layer4_x[no_kpt_mask]
        
        x = self.face_backbone.bn2(fuse_x)
        x = self.face_backbone.dropout(x)
        x = x.view(x.size(0), -1)
        x = self.face_backbone.fc(x)
        face_feat = self.face_backbone.features(x)
        
        # --------------------- get body_feat ---------------------
        body_feat, adapter_sam = self.body_backbone(body_img)
        
        # ---------- Fusion ----------
        fused_feat = self.fuse_proj(torch.cat([face_feat, body_feat], 1))
        
        # 如果沒有 body，用 face_feat 直接替代 fused_feat
        no_body_mask = (body_img.view(body_img.size(0), -1).abs().sum(dim=1) < 1e-6)
        if no_body_mask.any():
            fused_feat[no_body_mask] = face_feat[no_body_mask]
        
        return fused_feat, adapter_sam

import torch.nn.functional as F

#@title MagLinear - header
class MagLinear(torch.nn.Module):
    """
    Parallel fc for Mag loss
    """

    def __init__(self, in_features, out_features, scale=64.0, easy_margin=True):
        super(MagLinear, self).__init__()
        self.in_features = in_features
        self.out_features = out_features
        self.weight = torch.nn.Parameter(torch.Tensor(in_features, out_features))
        self.weight.data.uniform_(-1, 1).renorm_(2, 1, 1e-5).mul_(1e5)
        self.scale = scale
        self.easy_margin = easy_margin

    def forward(self, x, m, l_a, u_a, tilt_score):
        """
        Here m is a function which generate adaptive margin
        """
        x_norm = torch.norm(x, dim=1, keepdim=True).clamp(l_a, u_a)
        ada_margin = m(x_norm)
        # kpt aware margin
        ada_margin = ada_margin + tilt_score * 0.08
        cos_m, sin_m = torch.cos(ada_margin), torch.sin(ada_margin)

        # norm the weight
        weight_norm = F.normalize(self.weight, dim=0)
        cos_theta = torch.mm(F.normalize(x), weight_norm)
        cos_theta = cos_theta.clamp(-1, 1)
        sin_theta = torch.sqrt(1.0 - torch.pow(cos_theta, 2))
        cos_theta_m = cos_theta * cos_m - sin_theta * sin_m
        if self.easy_margin:
            cos_theta_m = torch.where(cos_theta > 0, cos_theta_m, cos_theta)
        else:
            mm = torch.sin(math.pi - ada_margin) * ada_margin
            threshold = torch.cos(math.pi - ada_margin)
            cos_theta_m = torch.where(
                cos_theta > threshold, cos_theta_m, cos_theta - mm)
        # multiply the scale in advance
        cos_theta_m = self.scale * cos_theta_m
        cos_theta = self.scale * cos_theta

        return [cos_theta, cos_theta_m], x_norm

#@title SoftmaxBuilder - combin backbone & header
class SoftmaxBuilder(nn.Module):
    def __init__(self, backbone, header, num_species, num_breeds, feat_dim=512):
        super(SoftmaxBuilder, self).__init__()
        self.features = backbone
        self.fc = header

        self.spec_head  = nn.Linear(feat_dim, num_species)
        self.breed_head = nn.Linear(feat_dim, num_breeds)

        self.l_margin = 0.45
        self.u_margin = 0.8
        self.l_a = 10
        self.u_a = 110

    def _margin(self, x):
        """generate adaptive margin
        """
        margin = (self.u_margin-self.l_margin) / \
            (self.u_a-self.l_a)*(x-self.l_a) + self.l_margin
        return margin

    def forward(self, body_x, x, norm_kpts, target, tilt_score):
        x, body_layer3_x = self.features(body_x, x, norm_kpts)
        logits, x_norm = self.fc(x, self._margin, self.l_a, self.u_a, tilt_score)

        spec_logits = self.spec_head(x)
        breed_logits = self.breed_head(x)
        
        return logits, spec_logits, breed_logits, x_norm, body_layer3_x

if __name__ == "__main__":
    pass
