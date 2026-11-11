#!/usr/bin/env python3
"""Build TomEng's scenario-first curriculum without losing phrase coverage.

Each session has exactly five phrase IDs. A session can introduce one to five
new IDs and use already-introduced phrases from the same scenario family to
make the conversation work. Every source ID is assigned to a new-candidate slot
exactly once; reinforcement IDs are explicitly marked and never counted as new.
"""
from __future__ import annotations

import csv
import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
read = lambda name: json.loads((ROOT / f"{name}.native.v3.json").read_text(encoding="utf-8"))
write = lambda name, data: (ROOT / f"{name}.native.v3.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

PHRASES = read("phrases")
PATTERNS = read("patterns")
OLD_LESSONS = read("lessons")
BY_ID = {phrase["id"]: phrase for phrase in PHRASES}
PATTERN_BY_ID = {pattern["id"]: pattern for pattern in PATTERNS}
PATTERN_ORDER = {pattern["id"]: index for index, pattern in enumerate(PATTERNS)}

# Each cluster is one repeatable real-life task. Related subcategories can share
# a scene (for example finding groceries and tracking their delivery); unrelated
# medical, office, restaurant and travel tasks stay in separate clusters.
CLUSTERS = [
    {"id":"casual-small-talk","category":"everyday","subs":["casual-check-in","casual-conversation"],"title":"Bắt chuyện về cuối tuần và thời tiết","goal":"Hỏi thăm cuối tuần, phản hồi câu trả lời, chia sẻ một chi tiết của bạn rồi hỏi tiếp một câu nhẹ nhàng.","scene":"Bạn gặp đồng nghiệp trước giờ làm và trò chuyện ngắn về cuối tuần hoặc thời tiết.","role":"Bạn là đồng nghiệp đang bắt chuyện trước giờ làm."},
    {"id":"family-social-chat","category":"everyday","subs":["family-check-ins","opinions-reactions"],"title":"Cập nhật chuyện gia đình và trải nghiệm","goal":"Hỏi thăm người thân, phản hồi điều vừa nghe, chia sẻ một trải nghiệm gần đây và hỏi tiếp.","scene":"Bạn đang trò chuyện thân mật với một người bạn về gia đình và nơi hai người vừa ghé.","role":"Bạn là người bạn đang hỏi thăm và chia sẻ chuyện gần đây."},
    {"id":"workplace-help","category":"everyday","subs":["office-help","device-problems"],"title":"Nhờ giúp xử lý một vấn đề","goal":"Nêu vấn đề cụ thể, hỏi đúng cách hỗ trợ, kiểm tra hướng xử lý rồi cảm ơn hoặc hẹn bước tiếp theo.","scene":"Bạn đang cần đồng nghiệp hoặc người hỗ trợ giúp giải quyết một việc thực tế.","role":"Bạn là người cần hỗ trợ và đang trao đổi lịch sự với người có thể giúp."},
    {"id":"health-support","category":"everyday","subs":["urgent-assistance","pharmacy-symptoms"],"title":"Tìm hỗ trợ khi không khỏe","goal":"Mô tả tình trạng, nói rõ cần giúp gì, hỏi lựa chọn an toàn và xác nhận bước tiếp theo.","scene":"Bạn đang tìm hỗ trợ y tế hoặc hỏi dược sĩ về một triệu chứng.","role":"Bạn là người cần trợ giúp; nếu triệu chứng nghiêm trọng, hãy liên hệ dịch vụ y tế phù hợp."},
    {"id":"food-order","category":"everyday","subs":["food-ordering"],"title":"Đặt món và chốt yêu cầu","goal":"Hỏi lựa chọn, gọi món, nêu điều chỉnh cần thiết, thêm món nếu muốn rồi xác nhận đơn.","scene":"Bạn đang gọi món tại quán ăn cho mình hoặc một nhóm nhỏ.","role":"Bạn là khách đang trao đổi với nhân viên phục vụ."},
    {"id":"cafe-order","category":"everyday","subs":["cafe-drinks"],"title":"Gọi đồ uống theo ý mình","goal":"Chọn đồ uống, hỏi cỡ hoặc thành phần, nêu cách pha và xác nhận dùng tại chỗ hay mang đi.","scene":"Bạn đang gọi đồ uống tại quán cà phê.","role":"Bạn là khách đang gọi đồ uống ở quầy."},
    {"id":"restaurant-seating","category":"everyday","subs":["restaurant-seating"],"title":"Tìm bàn phù hợp","goal":"Hỏi bàn còn trống, nêu số người hoặc vị trí muốn ngồi, xác nhận thời gian chờ và chốt lựa chọn.","scene":"Bạn vừa đến nhà hàng cùng người đi chung và cần tìm chỗ ngồi.","role":"Bạn là khách đang hỏi nhân viên nhà hàng."},
    {"id":"grocery-delivery","category":"everyday","subs":["grocery-shopping","deliveries-tracking"],"title":"Mua và theo dõi đơn hàng tạp hóa","goal":"Tìm món cần mua, hỏi tình trạng hàng hoặc lựa chọn thay thế, rồi kiểm tra thời gian và cách nhận đơn.","scene":"Bạn đang mua thực phẩm và cần theo dõi đơn tạp hóa được giao.","role":"Bạn là khách đang trao đổi với nhân viên cửa hàng hoặc đơn vị giao hàng."},
    {"id":"clothing-purchase","category":"everyday","subs":["clothes-shopping","payments-receipts"],"title":"Mua quần áo và kiểm tra khoản thanh toán","goal":"Chọn món hoặc kích cỡ, hỏi màu khác, xác nhận phí hoặc hóa đơn rồi làm rõ cách đổi nếu cần.","scene":"Bạn đang mua quần áo tại cửa hàng hoặc hoàn tất một đơn mua quần áo trực tuyến.","role":"Bạn là khách đang kiểm tra món hàng và giao dịch mua sắm."},
    {"id":"travel-arrival","category":"everyday","subs":["asking-directions","ride-hailing","hotel-stays"],"title":"Di chuyển và xử lý yêu cầu khi đi xa","goal":"Hỏi đường hoặc điểm đón, xác nhận chặng đi, đến nơi rồi nêu một yêu cầu lưu trú cụ thể.","scene":"Bạn đang đi đến một địa điểm mới và phối hợp phương tiện cùng nơi lưu trú.","role":"Bạn là khách đang hỏi người địa phương, tài xế hoặc nhân viên khách sạn."},
    {"id":"social-plans","category":"everyday","subs":["making-plans"],"title":"Rủ bạn và chốt kế hoạch","goal":"Đưa ra lời mời, hỏi thời gian phù hợp, đề xuất phương án khác và xác nhận lịch cuối cùng.","scene":"Bạn đang nhắn tin với một người bạn để sắp xếp buổi gặp.","role":"Bạn là người đưa ra lời mời và cùng người kia chốt thời gian."},
    {"id":"appointments","category":"everyday","subs":["appointments-times"],"title":"Đặt hoặc đổi lịch hẹn","goal":"Nêu thời gian mong muốn, hỏi khung giờ trống, đề xuất giờ khác và xác nhận lịch mới.","scene":"Bạn đang gọi điện hoặc nhắn tin để đặt hay đổi một cuộc hẹn.","role":"Bạn là người đặt lịch với phòng khám hoặc đơn vị dịch vụ."},
    {"id":"reflex-clarity","category":"reflex","subs":["ask-for-clarification","missed-information","buy-time"],"title":"Giữ cuộc trao đổi khi cần hỏi lại","goal":"Nói rõ phần chưa chắc, xin nhắc lại hoặc diễn đạt lại, xác nhận cách hiểu và báo khi cần kiểm tra thêm.","scene":"Bạn vừa bỏ lỡ một chi tiết hoặc cần thêm thời gian trước khi trả lời trong cuộc trao đổi.","role":"Bạn là người tham gia hội thoại và cần phản hồi bình tĩnh, rõ ràng."},
    {"id":"meeting-flow","category":"meeting","subs":["start-meeting","invite-feedback","action-and-closure","pushback"],"title":"Trao đổi phương án trong cuộc họp","goal":"Nêu mục tiêu, mời góp ý, làm rõ lo ngại, phản biện bằng lý do rồi chốt quyết định hoặc đầu việc.","scene":"Bạn đang điều phối một cuộc họp ngắn để xem xét một đề xuất hoặc thay đổi.","role":"Bạn là người tham gia hoặc điều phối cuộc họp."},
    {"id":"product-review","category":"design","subs":["usability-review","interaction-states","design-system","research-strategy"],"title":"Review và cải thiện một luồng sản phẩm","goal":"Nêu vấn đề người dùng, mô tả hành vi giao diện, hỏi bằng chứng và thống nhất thay đổi có thể kiểm chứng.","scene":"Bạn đang review một luồng sản phẩm cùng Designer, BA và Developer.","role":"Bạn là người làm Product/UX đang trao đổi với nhóm sản phẩm."},
    {"id":"business-discovery","category":"business","subs":["business-rules","edge-cases","operational-workflow","stakeholder-validation"],"title":"Làm rõ nghiệp vụ và ngoại lệ","goal":"Tìm hiểu quy trình thật, hỏi điều kiện áp dụng, làm rõ ngoại lệ và xác nhận yêu cầu với stakeholder.","scene":"Bạn đang phỏng vấn người dùng nghiệp vụ trước khi chốt yêu cầu.","role":"Bạn là BA đang làm rõ nghiệp vụ với stakeholder."},
    {"id":"engineering-delivery","category":"engineering","subs":["dev-handoff","qa-triage","release-and-deployment"],"title":"Bàn giao, kiểm thử và phát hành","goal":"Mô tả hành vi cần làm, xác nhận lỗi và điều kiện kiểm thử, thống nhất người phụ trách rồi chuẩn bị phát hành.","scene":"Bạn đang phối hợp với Developer và QA để đưa một thay đổi an toàn lên production.","role":"Bạn là người phối hợp cùng Developer hoặc QA."},
    {"id":"leadership-alignment","category":"leadership","subs":["priority-tradeoffs","lead-with-clarity"],"title":"Chọn ưu tiên và truyền đạt quyết định","goal":"So sánh tác động với nguồn lực, nêu điều phải đánh đổi, chọn hướng làm trước và nói rõ người phụ trách.","scene":"Bạn đang cùng nhóm thống nhất ưu tiên và cách truyền đạt quyết định.","role":"Bạn là người phụ trách cần giúp nhóm thống nhất hướng đi."},
]

def phrase_role(phrase: dict) -> str:
    """Use the full sentence frame so similar starters still have clear turns."""
    pattern = PATTERN_BY_ID[phrase["patternId"]]["pattern"]
    return phrase.get("focus") or pattern

def build_group(record: dict, cluster: dict, local_index: int) -> dict:
    phrase_ids = record["phraseIds"]
    phrases = [BY_ID[phrase_id] for phrase_id in phrase_ids]
    intents = [phrase_role(phrase) for phrase in phrases]
    if len(set(intents)) != 5:
        # Same spoken starter can serve different functions; use the full
        # curated pattern frame to expose the actual turn each phrase plays.
        intents = [PATTERN_BY_ID[phrase["patternId"]]["pattern"] for phrase in phrases]
    if len(set(intents)) != 5:
        raise ValueError(f"Five scenario turns need distinct phrase patterns: {cluster['id']} {phrase_ids} {intents}")
    steps = [{"phraseId":phrase["id"],"patternId":phrase["patternId"],"intent":intent,"cue":phrase["vi"],"turn":index+1,"kind":"new" if phrase["id"] in record["newPhraseIds"] else "reuse"} for index,(phrase,intent) in enumerate(zip(phrases,intents))]
    return {
        "phraseIds": phrase_ids,
        "candidatePhraseIds": record["newPhraseIds"],
        "reusePhraseIds": record["reinforcementPhraseIds"],
        "newCount": len(record["newPhraseIds"]),
        "primaryCategoryId": cluster["category"],
        "familyId": cluster["id"],
        "scenarioId": record["scenarioId"],
        "scenarioTitle": cluster["title"],
        "scenarioGoal": cluster["goal"],
        "roleContext": cluster["role"],
        "difficulty": "A2-B1" if cluster["category"] in ("everyday","reflex") else "B1-B2",
        "scenarioContext": cluster["scene"],
        "scenarioBridge": f"Các câu thuộc cùng mạch: {cluster['goal']}",
        "steps": steps,
        "practicePrompt": f"{cluster['role']} {cluster['scene']} {cluster['goal']} Hãy dùng cả năm câu; câu cũ giúp nối mạch, chỉ câu mới làm tăng tiến độ.",
        "whyThesePhrases": "Năm lượt được chọn từ cùng một tình huống; câu đã học được đánh dấu riêng để hỗ trợ hội thoại và không được tính lại là câu mới.",
    }

def records_for_cluster(cluster: dict) -> list[dict]:
    # Interleave communicative functions from related shelves. Grouping five
    # adjacent patterns from one subcategory often produced five ways to ask
    # the same question instead of a useful conversation path.
    queues = {sub:[pattern for pattern in PATTERNS if pattern["subCategoryId"] == sub and pattern["categoryId"] == cluster["category"]] for sub in cluster["subs"]}
    ordered = []
    while any(queues.values()):
        for sub in cluster["subs"]:
            if queues[sub]: ordered.append(queues[sub].pop(0))
    if len(ordered) < 5:
        raise ValueError(f"Scenario cluster {cluster['id']} needs at least five phrase patterns")
    full_count = len(ordered) // 5
    full_bundles = [ordered[index*5:(index+1)*5] for index in range(full_count)]
    leftovers = ordered[full_count*5:]
    records = []
    # A complete scenario uses five distinct patterns with the same content
    # variant. This preserves the source's coherent nouns and situation.
    for bundle_index, bundle in enumerate(full_bundles, start=1):
        for variant in range(5):
            ids = [pattern["phraseIds"][variant] for pattern in bundle]
            records.append({"phraseIds":ids,"newPhraseIds":ids.copy(),"reinforcementPhraseIds":[],"scenarioId":f"{cluster['id']}-{bundle_index:02d}-{variant+1:02d}","variant":variant,"bundle":bundle_index})
    # A partial bundle has fewer new phrases. Fill its five total turns with
    # already-covered phrases from an earlier bundle in the same scenario.
    # Runtime verifies those support IDs were introduced before offering it.
    if leftovers:
        support_bundle = full_bundles[0]
        for variant in range(5):
            new_ids = [pattern["phraseIds"][variant] for pattern in leftovers]
            needed = 5 - len(new_ids)
            support_ids = [pattern["phraseIds"][variant] for pattern in support_bundle if pattern["id"] not in {item["id"] for item in leftovers}][:needed]
            if len(support_ids) != needed:
                raise ValueError(f"Cannot fill the five-turn leftover scenario: {cluster['id']}")
            ids = new_ids + support_ids
            records.append({"phraseIds":ids,"newPhraseIds":new_ids,"reinforcementPhraseIds":support_ids,"scenarioId":f"{cluster['id']}-tail-{variant+1:02d}","variant":variant,"bundle":full_count+1})
    return records

def interleave_scenarios() -> list[dict]:
    by_category: dict[str, list[list[dict]]] = defaultdict(list)
    for cluster in CLUSTERS:
        by_category[cluster["category"]].append([build_group(item,cluster,index+1) for index,item in enumerate(records_for_cluster(cluster))])
    # Rotate situations within each track before weighted interleaving the
    # categories. This avoids long runs of meetings, ordering or small talk.
    rotated = {}
    for category, queues in by_category.items():
        category_records=[]
        while any(queues):
            for queue in queues:
                if queue: category_records.append(queue.pop(0))
        rotated[category]=category_records
    weights={category:len(items) for category,items in rotated.items()}
    total=sum(weights.values());scores={category:0 for category in weights};offsets={category:0 for category in weights};ordered=[];last=None
    while len(ordered)<total:
        for category,weight in weights.items():scores[category]+=weight
        candidates=sorted(weights,key=lambda category:(scores[category],category==last,category),reverse=True)
        category=next((item for item in candidates if offsets[item]<len(rotated[item]) and (item!=last or all(offsets[other]>=len(rotated[other]) for other in candidates if other!=item))),None)
        if category is None:category=next(item for item in candidates if offsets[item]<len(rotated[item]))
        scores[category]-=total;ordered.append(rotated[category][offsets[category]]);offsets[category]+=1;last=category
    return ordered

def main() -> None:
    new_scenarios = interleave_scenarios()
    candidate_ids = [phrase_id for scenario in new_scenarios for phrase_id in scenario["candidatePhraseIds"]]
    assert len(candidate_ids) == 1050 and len(set(candidate_ids)) == 1050
    assert set(candidate_ids) == {phrase["id"] for phrase in PHRASES[150:]}
    lessons=[]
    # Keep the first 30 core lessons and their exact five phrase IDs unchanged.
    for index,old in enumerate(OLD_LESSONS[:30]):
        ids=list(old["phraseIds"]);scenario_id=f"legacy-core-{index+1:02d}"
        category=old["primaryCategoryId"];role=next((item["role"] for item in CLUSTERS if item["category"]==category),"Bạn đang xử lý một tình huống thực tế.")
        steps=[{"phraseId":phrase_id,"patternId":BY_ID[phrase_id]["patternId"],"intent":old.get("steps",[{}]*5)[turn].get("intent") or phrase_role(BY_ID[phrase_id]),"cue":BY_ID[phrase_id]["vi"],"turn":turn+1,"kind":"new"} for turn,phrase_id in enumerate(ids)]
        lesson={**old,"phraseIds":ids,"candidatePhraseIds":ids.copy(),"reusePhraseIds":[],"newCount":5,"scenarioId":scenario_id,"scenarioTitle":old["title"],"scenarioGoal":f"Xử lý tình huống “{old['title'].lower()}” bằng các câu trong bài.","roleContext":role,"difficulty":"B1","scenarioContext":BY_ID[ids[0]]["context"],"scenarioBridge":"Năm câu giữ nguyên nhóm cốt lõi và ID ban đầu.","steps":steps,"practicePrompt":f"{role} Hãy xử lý tình huống “{old['title'].lower()}” bằng các câu trong bài.","whyThesePhrases":"Nhóm 5 câu gốc được giữ nguyên để bảo toàn ID và tiến độ."}
        lesson.pop("newPhraseIds",None);lesson.pop("reinforcementPhraseIds",None);lessons.append(lesson)
    for offset,scenario in enumerate(new_scenarios,start=31):
        lessons.append({"id":f"day-{offset:03d}","day":offset,"title":scenario["scenarioTitle"],"phraseIds":scenario["phraseIds"],"candidatePhraseIds":scenario["candidatePhraseIds"],"reusePhraseIds":scenario["reusePhraseIds"],"newCount":scenario["newCount"],"primaryCategoryId":scenario["primaryCategoryId"],"primarySubCategoryId":BY_ID[scenario["candidatePhraseIds"][0]]["subCategoryId"],"reviewRequired":True,"reviewPhraseIds":[],"durationEstimateMinutes":10,"language":"en-US",**{key:value for key,value in scenario.items() if key not in ("phraseIds","candidatePhraseIds","reusePhraseIds","newCount")}})
    for index,lesson in enumerate(lessons):
        lesson["reviewPhraseIds"]=[] if index==0 else list(lessons[index-1]["phraseIds"])
        lesson["reviewRequired"]=index>0
    write("lessons",lessons)
    mapping=ROOT/"SCENARIO_MAPPING_V3_4.csv"
    with mapping.open("w",encoding="utf-8",newline="") as stream:
        writer=csv.DictWriter(stream,fieldnames=["lessonId","day","category","scenarioId","scenarioTitle","scenarioGoal","roleContext","phraseIds","candidatePhraseIds","reusePhraseIds","intents","whyThesePhrases"],lineterminator="\n")
        writer.writeheader()
        for lesson in lessons:
            writer.writerow({"lessonId":lesson["id"],"day":lesson["day"],"category":lesson["primaryCategoryId"],"scenarioId":lesson["scenarioId"],"scenarioTitle":lesson["scenarioTitle"],"scenarioGoal":lesson["scenarioGoal"],"roleContext":lesson["roleContext"],"phraseIds":" | ".join(lesson["phraseIds"]),"candidatePhraseIds":" | ".join(lesson["candidatePhraseIds"]),"reusePhraseIds":" | ".join(lesson["reusePhraseIds"]),"intents":" | ".join(step["intent"] for step in lesson["steps"]),"whyThesePhrases":lesson["whyThesePhrases"]})
    print(f"Built {len(lessons)} five-phrase scenario candidates; {len(candidate_ids)+150} unique IDs assigned once as new; {sum(len(x['reusePhraseIds']) for x in lessons)} planned reuse slots")

if __name__ == "__main__":
    main()
