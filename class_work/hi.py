import qrcode

img = qrcode.make("https://www.youtube.com/shorts/sovD5n7g2iQ")
img.save("qr.png", "PNG")
