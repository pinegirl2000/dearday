"""fonts/ 의 TTF 를 웹용 woff2 로 변환해 src/fonts/ 에 저장.

왜: 원본 TTF 는 한자·옛한글까지 들어 있어 파일당 2~8MB — 그대로 웹폰트로 쓰면 초대장 로딩이 느려진다.
한글 음절 11,172자 + 자모 + 라틴 + 기본 문장부호만 남기고 woff2 로 압축한다.
실행: python3 scripts/convert-fonts.py  (fonttools, brotli 필요)
"""
from fontTools import subset
from fontTools.ttLib import TTFont
import os

# 원본 파일명 → 결과 파일명 (공백·한글 파일명은 빌드 도구에서 문제가 될 수 있어 ASCII 로)
FONTS = {
    'GmarketSansTTFMedium.ttf': 'gmarket-sans-medium',
    'GmarketSansTTFBold.ttf': 'gmarket-sans-bold',
    # tvN 즐거운이야기는 변환하지 않음 — 라이선스가 글꼴 수정을 금지
    '강원교육모두+Bold.ttf': 'gangwon-modu-bold',
    '강원교육튼튼.ttf': 'gangwon-teunteun',
    '강원교육새음.ttf': 'gangwon-saeeum',
    '강원교육현옥샘.ttf': 'gangwon-hyeonok',
}
# 라틴 기본·보충, 일반 문장부호, 한글 자모·호환 자모·음절, 자주 쓰는 기호(♥ ✽ 등은 글꼴에 있으면 유지)
UNICODES = 'U+0020-007E,U+00A0-00FF,U+2010-2027,U+2030-203A,U+20A9,U+2190-2193,U+2661,U+2665,U+3000-3003,U+3131-318E,U+AC00-D7A3'

for src, name in FONTS.items():
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['*']
    opts.unicodes = subset.parse_unicodes(UNICODES)
    font = TTFont(os.path.join('fonts', src))
    sub = subset.Subsetter(opts)
    sub.populate(unicodes=opts.unicodes)
    sub.subset(font)
    out = os.path.join('src', 'fonts', name + '.woff2')
    font.flavor = 'woff2'
    font.save(out)
    print(f'{name}.woff2  {os.path.getsize(out) / 1024:.0f} KB  (원본 {os.path.getsize(os.path.join("fonts", src)) / 1024:.0f} KB)')
