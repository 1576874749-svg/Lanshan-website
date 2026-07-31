import qrcode
import qrcode.image.svg

targets = {
    "wechat": "https://weixin.qq.com/r/lanshan-studio",
    "xiaohongshu": "https://www.xiaohongshu.com/user/profile/lanshan",
    "bilibili": "https://space.bilibili.com/lanshan",
}
for name, url in targets.items():
    img = qrcode.make(url, image_factory=qrcode.image.svg.SvgPathImage,
                      box_size=10, border=2)
    out = rf"c:\Users\admin\Desktop\lanshan-studio-website\assets\qr-{name}.svg"
    img.save(out)
    print("saved", out)
