"""
간단한 아이콘 생성 스크립트 (PIL 사용)
"""
try:
    from PIL import Image, ImageDraw, ImageFont
    import os
    
    # 192x192 아이콘 생성
    icon_192 = Image.new('RGB', (192, 192), color='#667eea')
    draw = ImageDraw.Draw(icon_192)
    # 간단한 원 그리기
    draw.ellipse([20, 20, 172, 172], fill='white', outline='white', width=5)
    # 텍스트 추가 (선택사항)
    try:
        font = ImageFont.truetype("arial.ttf", 60)
    except:
        font = ImageFont.load_default()
    draw.text((96, 96), "ZOOM", fill='#667eea', anchor='mm', font=font)
    icon_192.save('icon-192.png')
    print('icon-192.png 생성 완료')
    
    # 512x512 아이콘 생성
    icon_512 = Image.new('RGB', (512, 512), color='#667eea')
    draw = ImageDraw.Draw(icon_512)
    draw.ellipse([50, 50, 462, 462], fill='white', outline='white', width=15)
    try:
        font = ImageFont.truetype("arial.ttf", 160)
    except:
        font = ImageFont.load_default()
    draw.text((256, 256), "ZOOM", fill='#667eea', anchor='mm', font=font)
    icon_512.save('icon-512.png')
    print('icon-512.png 생성 완료')
    
except ImportError:
    print("PIL이 설치되어 있지 않습니다. pip install Pillow로 설치하세요.")
    print("또는 온라인에서 아이콘을 다운로드하여 static 폴더에 저장하세요.")
except Exception as e:
    print(f"아이콘 생성 오류: {e}")





