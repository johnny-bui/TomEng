"""Reproducible V3 editorial corrections; keep phrase IDs and lesson order stable."""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).parent
phrases = json.loads((ROOT / 'phrases.native.v3.json').read_text())
by_id = {p['id']: p for p in phrases}
issues = []


def edit(number, reason, **fields):
    phrase = by_id[f'p{number:03d}']
    before = {key: phrase[key] for key in fields}
    phrase.update(fields)
    issues.append((phrase['id'], reason, before, fields))


# The package assigns one generic follow-up to each family. These lines are
# learner-side suggestions, so tailor them to what the learner just said.
for phrase in phrases[150:]:
    en = phrase['en']
    follow = phrase['follow']
    replacement = None
    if follow == "It's always nice to take a short break.":
        replacement = "What about you?" if '?' not in en else "I'd love to hear more."
        if en.startswith('Let me know'):
            replacement = "I'd love to hear about it tomorrow."
    elif follow == 'Nice catching up with you.':
        replacement = "How about you?" if '?' not in en else "Tell me more about it."
    elif follow == "I'd give it another try.":
        if 'recommend' in en or 'really enjoyed' in en:
            replacement = "I think you'd enjoy it too."
        elif 'not sure' in en.lower():
            replacement = "I might give it another try."
    elif follow == 'Thank you. I need help as soon as possible.':
        replacement = 'Please call them now.' if any(w in en for w in ('ambulance', 'hospital', 'doctor')) else 'Please tell me what to do next.'
    elif follow == 'I can be flexible with the time.':
        if 'remind me' in en:
            replacement = 'Could you text me the time?'
        elif 'prepare' in en:
            replacement = 'Is there anything specific I should bring?'
    elif follow == 'Thanks, I really appreciate it.' and en.startswith('Thanks for'):
        replacement = 'That saved me a lot of time.'
    elif follow == 'Can you show me how it works in a real case?' and en.startswith("I'll demonstrate"):
        replacement = 'Let me walk through one real example.'
    elif follow == 'I understand the intention; I\'m questioning the impact.' and en.startswith('I understand the idea'):
        replacement = 'What would change for users?'
    elif follow == "Let's confirm the exact steps to reproduce it." and en.startswith('Did the latest fix resolve'):
        replacement = 'If not, let’s capture the steps again.'
    elif follow == "That's all, thanks." and en.startswith('Is a'):
        replacement = "I'll take one without sugar, please."
    if replacement and replacement != follow:
        edit(int(phrase['id'][1:]), 'Câu nối tiếp mẫu thiếu phù hợp ngữ cảnh', follow=replacement)


explicit = {
    464: ('Lặp từ gây khó hiểu', dict(en='Let me explain how loading should work.', vi='Để tôi giải thích trạng thái tải nên hoạt động thế nào.', pattern='Let me explain how … should work.', memoryTip='Nói rõ trạng thái, điều kiện và kết quả mong đợi; dùng một câu ngắn để mở đầu.', follow="I'll add the details to the handoff.")),
    628: ('Sai hòa hợp chủ vị', dict(en="Let's check whether the spacing tokens follow the standard.", vi='Mình kiểm tra xem các token khoảng cách có đúng tiêu chuẩn không nhé.', pattern="Let's check whether … follow the standard.")),
    504: ('Bản dịch sai đối tượng', dict(vi='Khâu nào tốn nhiều thời gian nhất khi cập nhật chính sách?')),
    256: ('Thiếu câu xử lý lỗi thanh toán thực tế', dict(en='I think I was charged twice for delivery.', vi='Hình như tôi bị tính phí giao hàng hai lần.', context='Khi thấy hai khoản phí giao hàng giống nhau trên hóa đơn hoặc ứng dụng.', follow='Could you check the receipt for me?', pattern='I think I was charged twice for ….', memoryTip='“I was charged twice” báo bị tính tiền hai lần; đưa hóa đơn để nhân viên kiểm tra.')),
    943: ('Lặp từ và ý', dict(en="Let's check on the action items tomorrow.", vi='Ngày mai mình kiểm tra tiến độ các việc cần làm nhé.', pattern="Let's check on … tomorrow.", follow="I'll ask each owner for an update.")),
    707: ('Câu hỏi kỹ thuật thiếu tự nhiên', dict(en='Can we implement this error message?', vi='Mình có thể triển khai thông báo lỗi này không?', pattern='Can we implement …?', memoryTip='Khi bàn giao, hỏi trực tiếp liệu nhóm có thể triển khai thiết kế này không.')),
    917: ('Câu hỏi kỹ thuật thiếu tự nhiên', dict(en='Can we implement role-based permissions?', vi='Mình có thể triển khai phân quyền theo vai trò không?', pattern='Can we implement …?', memoryTip='Khi bàn giao, hỏi trực tiếp liệu nhóm có thể triển khai thiết kế này không.')),
    455: ('Cách gọi món gượng', dict(en='Can I get a bowl of pho?', vi='Cho mình một tô phở được không?', pattern='Can I get …?', memoryTip='“Can I get…?” là cách gọi món ngắn và lịch sự.')),
    845: ('Cách hỏi đường gượng', dict(en='How far is the nearest pharmacy?', vi='Nhà thuốc gần nhất cách đây bao xa?', pattern='How far is …?', memoryTip='“How far is…?” hỏi khoảng cách; “from here” thêm khi cần nhấn mạnh điểm xuất phát.')),
    490: ('Small talk dịch sát chữ', dict(en='Did your morning go well?', vi='Sáng nay của bạn ổn chứ?', pattern='Did … go well?', memoryTip='“Did … go well?” hỏi nhẹ xem một việc vừa qua có ổn không.')),
    700: ('Bản dịch small talk thiếu tự nhiên', dict(vi='Chuyến đi của bạn có vui không?')),
    280: ('Bản dịch small talk thiếu tự nhiên', dict(vi='Cuối tuần của bạn có vui không?')),
    312: ('Reset Wi-Fi mơ hồ', dict(en='Do you know how to restart my router?', vi='Bạn biết cách khởi động lại bộ phát Wi-Fi nhà mình không?', pattern='Do you know how to restart …?', memoryTip='“Restart” là khởi động lại; tránh “reset” nếu không định xóa cài đặt.')),
    522: ('Reset điện thoại có thể xóa dữ liệu', dict(en='Do you know how to restart my phone?', vi='Bạn biết cách khởi động lại điện thoại mình không?', pattern='Do you know how to restart …?', memoryTip='“Restart” là khởi động lại; “reset” có thể xóa cài đặt.')),
    732: ('Reset máy in mơ hồ', dict(en='Do you know how to restart the printer?', vi='Bạn biết cách khởi động lại máy in không?', pattern='Do you know how to restart …?', memoryTip='“Restart” là khởi động lại; tránh “reset” nếu không định xóa cài đặt.')),
    411: ('Bản dịch small talk thiếu tự nhiên', dict(vi='Bạn đi làm sáng nay thế nào?')),
    398: ('Bản dịch lặp từ', dict(vi='Mình muốn đổi lịch khám răng.')),
    859: ('Bản dịch lặp từ', dict(vi='Bạn xác nhận lại khung giờ giao hàng giúp mình được không?')),
    910: ('Bản dịch small talk thiếu tự nhiên', dict(vi='Bạn có thích dự án mới không?')),
    862: ('Câu nối tiếp trái nghĩa câu khen', dict(follow='I think you would enjoy it too.')),
    945: ('Không tự nhiên khi recommend chuyến đi', dict(en="I'd definitely recommend going there.", vi='Mình chắc chắn sẽ giới thiệu nơi đó.', pattern="I'd definitely recommend going there.", follow='I think you would enjoy it too.')),
    885: ('Collocation chưa tự nhiên', dict(en='What do we learn from where users drop off?', vi='Mình học được gì từ điểm người dùng rời luồng?', pattern='What do we learn from …?', memoryTip='Hỏi điều dữ liệu chỉ ra bằng một câu ngắn, rồi kiểm tra với người dùng thật.')),
    330: ('Câu hỏi độ ngọt tại quán thiếu tự nhiên', dict(en='Is the iced latte sweetened?', vi='Latte đá có được thêm đường không?', pattern='Is … sweetened?', follow='Could I get it without added sugar?')),
    540: ('Câu hỏi độ ngọt tại quán thiếu tự nhiên', dict(en='Is the cappuccino sweetened?', vi='Cappuccino có được thêm đường không?', pattern='Is … sweetened?', follow='Could I get it without added sugar?')),
    750: ('Câu hỏi độ ngọt tại quán thiếu tự nhiên', dict(en='Is the green tea sweetened?', vi='Trà xanh có được thêm đường không?', pattern='Is … sweetened?', follow='Could I get it without added sugar?')),
    960: ('Câu hỏi độ ngọt tại quán thiếu tự nhiên', dict(en='How sweet is the hot chocolate?', vi='Sô-cô-la nóng ngọt cỡ nào?', pattern='How sweet is …?', follow='Could you make it less sweet?')),
    1170: ('Câu hỏi độ ngọt tại quán thiếu tự nhiên', dict(en='Does the black coffee have any sugar in it?', vi='Cà phê đen có pha sẵn đường không?', pattern='Does … have any sugar in it?', follow='Could I get it without sugar?')),
    1024: ('Bản dịch triệu chứng không gọn', dict(vi='Bụng mình đang khó chịu.')),
    1066: ('Bản dịch triệu chứng không gọn', dict(vi='Có loại thuốc nào giúp bụng đỡ khó chịu không?')),
    1107: ('Bản dịch triệu chứng không gọn', dict(vi='Bụng khó chịu như vậy thường kéo dài bao lâu?')),
    1151: ('Bản dịch triệu chứng không gọn', dict(vi='Bụng khó chịu như vậy thì mình có nên đi khám không?')),
    638: ('Collocation chưa tự nhiên', dict(en='We need more evidence from user feedback.', vi='Mình cần thêm bằng chứng từ phản hồi của người dùng.', pattern='We need more evidence from ….', memoryTip='Nêu rõ nguồn bằng chứng cần bổ sung trước khi quyết định.')),
    679: ('Câu phản hồi dài và lặp ý', dict(en="I'll get back to you about the latest feedback after this call.", vi='Sau cuộc gọi này tôi sẽ phản hồi về ý kiến mới nhất.', pattern="I'll get back to you about … after this call.", follow="I'll send a clear answer today.")),
}

for number in (457, 667, 877, 1087):
    p = by_id[f'p{number:03d}']
    item = p['en'].removeprefix('Do you have ').removesuffix(' in a large size?')
    item = item.removeprefix('a ')
    translated = {457:'cappuccino',667:'trà xanh',877:'sô-cô-la nóng',1087:'cà phê đen'}[number]
    explicit[number] = ('Gọi đồ uống cỡ lớn theo lối hỏi tồn kho', dict(en=f'Can I get a large {item}?', vi=f'Cho mình một ly {translated} cỡ lớn được không?', pattern='Can I get a large …?', memoryTip='“Can I get a large…?” là cách gọi đồ uống cỡ lớn ngắn và tự nhiên.'))

for number, subject, vi in ((288,'the user impact','tác động đến người dùng'),(498,'the technical risk','rủi ro kỹ thuật'),(708,'the latest feedback','phản hồi mới nhất'),(918,'the edge cases','các trường hợp ngoại lệ')):
    explicit[number] = ('Dùng jargon park trong ngữ cảnh xin thời gian', dict(en=f'Can I take a moment to think through {subject}?', vi=f'Cho tôi một chút thời gian nghĩ kỹ về {vi} được không?', pattern='Can I take a moment to think through …?', memoryTip='“Can I take a moment…?” xin vài giây suy nghĩ mà vẫn giữ mạch trò chuyện.', follow="I'll get back to you with a clear answer."))

for number, (reason, fields) in explicit.items():
    edit(number, reason, **fields)

for p in phrases[150:]:
    if p['en'].startswith('Thanks for') and p['follow'].startswith('Thanks'):
        edit(int(p['id'][1:]), 'Câu nối tiếp lặp lời cảm ơn', follow='That really helped me out.')

# Pattern metadata is derived from the corrected family heads so labels do not
# describe wording that no longer exists. IDs and phrase membership stay fixed.
patterns = json.loads((ROOT / 'patterns.native.v3.json').read_text())
for family in patterns:
    head = by_id[family['phraseIds'][0]]
    family['pattern'] = head['pattern']
    family['memoryTip'] = head['memoryTip']

(ROOT / 'phrases.native.v3.json').write_text(json.dumps(phrases, ensure_ascii=False, indent=2) + '\n')
(ROOT / 'patterns.native.v3.json').write_text(json.dumps(patterns, ensure_ascii=False, indent=2) + '\n')
with (ROOT / 'phrases.native.v3.csv').open('w', newline='') as stream:
    writer = csv.DictWriter(stream, fieldnames=phrases[0].keys())
    writer.writeheader()
    for p in phrases:
        writer.writerow({k: json.dumps(v, ensure_ascii=False) if isinstance(v, (list, dict)) else v for k, v in p.items()})

lines = [
    '# CONTENT QA ISSUES — TomEng Native V3', '',
    'Nguồn V3 là bản biên tập AI. Đã rà cấu trúc 1.200 câu, 210 họ mẫu và các biến thể; các sửa dưới đây được ghi theo ID. Chưa có người bản ngữ độc lập duyệt toàn bộ, vì vậy đây chưa phải chứng nhận nội dung native.', '',
    f'- Đã kiểm tra cấu trúc: {len(phrases)} câu; {len(patterns)} họ mẫu × 5 biến thể.',
    f'- Lượt sửa trường dữ liệu: {len(issues)}; số ID được sửa: {len(set(i[0] for i in issues))}.',
    '- Chặn phát hành nội dung cuối: cần biên tập viên tiếng Anh bản ngữ duyệt từng câu, đặc biệt tính tự nhiên của câu nối tiếp và các biến thể dùng chung mẫu.', '',
    '| ID | Lý do | Phương án đã áp dụng | Trạng thái |', '| --- | --- | --- | --- |'
]
for pid, reason, before, after in issues:
    proposal = '; '.join(f'{k}: {v}' for k, v in after.items()).replace('|', '\\|')
    lines.append(f'| {pid} | {reason} | {proposal} | Đã sửa bằng biên tập AI; chờ duyệt người |')
(ROOT / 'CONTENT_QA_ISSUES.md').write_text('\n'.join(lines) + '\n')
print(f'{len(phrases)} reviewed structurally; {len(set(i[0] for i in issues))} IDs edited; {len(issues)} edit operations')
