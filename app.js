// gaokao-planner app.js - 通用版（全国、全分数段、选科组合）
const STEPS=5;
let currentStep=0;
let answers={q2answers:{},q3answers:{},values:{salary:50,stability:50,growth:50,meaning:50},industries:[],industryMode:{},cities:[],rejectCities:[],rejectMajors:[],rejectIndustries:[],score:550,name:"",province:"",subjectCombo:"物化生",rankMode:"score",rank:0};

// ===== 省份数据 =====
const PROVINCES=["北京","天津","河北","山西","内蒙古","辽宁","吉林","黑龙江","上海","江苏","浙江","安徽","福建","江西","山东","河南","湖北","湖南","广东","广西","海南","重庆","四川","贵州","云南","西藏","陕西","甘肃","青海","宁夏","新疆"];

const SUBJECT_COMBOS=["物化生","物化政","物化地","物生政","物生地","物政地","史政地","史政生","史化生","史化地","史化政"];

// 分数线参考（2024年各省理科/物理类一本线近似值，供匹配用）
const SCORE_REF={
  "北京":{yiben:532,total:750},"天津":{yiben:563,total:750},"河北":{yiben:502,total:750},"山西":{yiben:517,total:750},
  "内蒙古":{yiben:471,total:750},"辽宁":{yiben:510,total:750},"吉林":{yiben:468,total:750},"黑龙江":{yiben:429,total:750},
  "上海":{yiben:504,total:660},"江苏":{yiben:516,total:750},"浙江":{yiben:595,total:750},"安徽":{yiben:514,total:750},
  "福建":{yiben:538,total:750},"江西":{yiben:530,total:750},"山东":{yiben:518,total:750},"河南":{yiben:521,total:750},
  "湖北":{yiben:533,total:750},"湖南":{yiben:522,total:750},"广东":{yiben:539,total:750},"广西":{yiben:502,total:750},
  "海南":{yiben:563,total:900},"重庆":{yiben:505,total:750},"四川":{yiben:539,total:750},"贵州":{yiben:484,total:750},
  "云南":{yiben:510,total:750},"西藏":{yiben:410,total:750},"陕西":{yiben:475,total:750},"甘肃":{yiben:442,total:750},
  "青海":{yiben:388,total:750},"宁夏":{yiben:432,total:750},"新疆":{yiben:450,total:750}
};

// 根据省份和分数计算"分档标签"
function getScoreTier(province,score){
  const ref=SCORE_REF[province];
  if(!ref) return {tier:"本科线附近",label:"本科线附近"};
  const diff=score-ref.yiben;
  if(diff>=80) return {tier:"985冲刺",label:"超一本线"+diff+"分 · 985冲刺档"};
  if(diff>=40) return {tier:"211核心",label:"超一本线"+diff+"分 · 211核心档"};
  if(diff>=0)  return {tier:"一本稳",label:"超一本线"+diff+"分 · 一本稳档"};
  if(diff>=-30) return {tier:"一本冲",label:"低于一本线"+Math.abs(diff)+"分 · 一本冲档"};
  return {tier:"二本核心",label:"低于一本线"+Math.abs(diff)+"分 · 二本核心档"};
}

const PERSONALITY_SCORING={
  1:{A:{t:"analytical",s:3},B:{t:"creative",s:3},C:{t:"social",s:3},D:{t:"practical",s:3}},
  2:{A:{t:"analytical",s:2},B:{t:"analytical",s:2},C:{t:"social",s:3},D:{t:"practical",s:3}},
  3:{A:{t:"leadership",s:3},B:{t:"creative",s:3},C:{t:"social",s:3},D:{t:"practical",s:3}},
  4:{A:{t:"analytical",s:3},B:{t:"creative",s:3},C:{t:"social",s:2},D:{t:"practical",s:2}},
  5:{A:{t:"analytical",s:3},B:{t:"creative",s:3},C:{t:"social",s:3},D:{t:"practical",s:3}},
  6:{A:{t:"analytical",s:3},B:{t:"creative",s:2},C:{t:"social",s:2},D:{t:"practical",s:3}},
  7:{A:{t:"leadership",s:3},B:{t:"creative",s:3},C:{t:"social",s:3},D:{t:"practical",s:2}},
  8:{A:{t:"analytical",s:3},B:{t:"creative",s:3},C:{t:"social",s:2},D:{t:"practical",s:3}},
};

const PERSONALITY_TYPES={
  analytical:{name:"分析研究型",icon:"\ud83d\udd2c",desc:"你逻辑清晰，善于深度思考，适合需要精确性和研究能力的发展方向。推荐：人工智能、微电子、数据科学、生物医药研发。"},
  creative:{name:"创新创造型",icon:"\ud83c\udfa8",desc:"你富有想象力和美感，喜欢新鲜事物，适合需要创意和跨界能力的方向。推荐：人工智能算法、数字创意、产品设计、建筑设计。"},
  social:{name:"社会关怀型",icon:"\ud83e\udd1d",desc:"你善于沟通协作，重视人与人之间的联系，适合能直接创造社会价值的方向。推荐：医学、药学、公共卫生、教育学。"},
  practical:{name:"实干动手型",icon:"\ud83d\udd27",desc:"你动手能力强，重视成果落地，适合需要实际操作和工程技术能力的方向。推荐：机器人工程、车辆工程、自动化、新能源工程。"},
  leadership:{name:"组织影响型",icon:"\ud83d\udc51",desc:"你善于统筹规划，有影响力，适合需要综合管理和战略眼光的领域。推荐：信息管理、金融工程、能源经济、航空航天。"},
};

const PERSONALITY_SCORES={analytical:0,creative:0,social:0,practical:0,leadership:0};

const INDUSTRY_DATA={
  ai:{name:"人工智能",trend:"up",score:95,desc:"AGI突破、AI应用爆发，未来10年持续高景气，人才缺口巨大"},
  semiconductor:{name:"芯片半导体",trend:"up",score:90,desc:"国产替代加速，政策强力支持，未来10年战略核心产业"},
  newenergy:{name:"新能源",trend:"up",score:88,desc:"双碳目标驱动，光伏、储能、氢能全面发展"},
  biomed:{name:"生物医药",trend:"up",score:85,desc:"人口老龄化+创新药爆发，生物医药迎来黄金十年"},
  auto:{name:"智能汽车",trend:"up",score:87,desc:"电动化+智能化双轮驱动，产业变革核心赛道"},
  robot:{name:"机器人",trend:"up",score:82,desc:"人形机器人量产在即，工业与服务机器人全面渗透"},
  finance:{name:"金融科技",trend:"stable",score:70,desc:"金融行业整体稳定，FinTech方向有新机会"},
  aerospace:{name:"航空航天",trend:"up",score:78,desc:"商业航天崛起，卫星互联网、深空探测持续推进"},
  medical:{name:"医疗器械",trend:"up",score:80,desc:"国产替代+老龄化需求，高端医疗器械空间巨大"},
  env:{name:"绿色环保",trend:"up",score:75,desc:"双碳政策持续，环保产业稳定增长"},
  media:{name:"数字创意",trend:"stable",score:68,desc:"元宇宙、AIGC推动创意产业变革，机会与风险并存"},
  logistics:{name:"智慧物流",trend:"stable",score:72,desc:"电商+自动化驱动，智慧物流稳步发展"},
};

// ===== 全国院校专业数据库（按分数档+选科覆盖）=====
const MAJOR_DB=[
  // ---- 985冲刺档 (超一本80+) ----
  {major:"人工智能",school:"浙江大学",score:665,province:"浙江",city:"杭州",industry:"ai",reason:"顶尖985，AI国际排名前列，就业顶级互联网+AI Lab",type:"冲刺",combos:["物化生","物化政","物化地","物生政"],traits:["analytical","creative"]},
  {major:"计算机科学与技术",school:"南京大学",score:658,province:"江苏",city:"南京",industry:"ai",reason:"南大CS实力顶尖，AI方向有周志华团队，学术+就业双优",type:"冲刺",combos:["物化生","物化政","物化地"],traits:["analytical","creative"]},
  {major:"人工智能",school:"西安交通大学",score:648,province:"陕西",city:"西安",industry:"ai",reason:"C9名校，AI学科评估A+，西北地区首选",type:"冲刺",combos:["物化生","物化政","物化地"],traits:["analytical"]},
  {major:"微电子科学与工程",school:"电子科技大学",score:645,province:"四川",city:"成都",industry:"semiconductor",reason:"电子类顶尖985，芯片方向就业华为海思/中芯国际",type:"冲刺",combos:["物化生","物化地"],traits:["analytical","practical"]},
  {major:"生物医学工程",school:"东南大学",score:640,province:"江苏",city:"南京",industry:"biomed",reason:"生医工全国前三，医疗器械+生物信息方向强",type:"冲刺",combos:["物化生"],traits:["analytical","social"]},
  {major:"新能源科学与工程",school:"华中科技大学",score:638,province:"湖北",city:"武汉",industry:"newenergy",reason:"能源动力顶尖，新能源方向就业宁德时代/比亚迪",type:"冲刺",combos:["物化生","物化地"],traits:["analytical","practical"]},
  {major:"临床医学(八年制)",school:"中南大学",score:642,province:"湖南",city:"长沙",industry:"biomed",reason:"湘雅医学院，医学顶尖，八年直博",type:"冲刺",combos:["物化生"],traits:["social","analytical"]},
  {major:"航空航天工程",school:"北京航空航天大学",score:655,province:"北京",city:"北京",industry:"aerospace",reason:"航空航天第一校，就业航天科技/科工集团",type:"冲刺",combos:["物化生","物化地"],traits:["analytical","practical"]},
  {major:"数据科学与大数据技术",school:"复旦大学",score:662,province:"上海",city:"上海",industry:"ai",reason:"复旦数据科学全国领先，就业顶级金融科技/互联网",type:"冲刺",combos:["物化生","物化政"],traits:["analytical","leadership"]},
  {major:"量子信息科学",school:"中国科学技术大学",score:660,province:"安徽",city:"合肥",industry:"ai",reason:"中科大前沿量子+AI，学术顶级，出国深造率高",type:"冲刺",combos:["物化生"],traits:["analytical","creative"]},
  {major:"金融科技",school:"中央财经大学",score:650,province:"北京",city:"北京",industry:"finance",reason:"财经顶尖211，金融科技方向就业顶级投行/券商",type:"冲刺",combos:["物化生","物化政","物化地"],traits:["analytical","leadership"]},
  {major:"智能制造工程",school:"上海交通大学",score:668,province:"上海",city:"上海",industry:"robot",reason:"上交机械+计算机交叉，智能制造新方向",type:"冲刺",combos:["物化生","物化地"],traits:["practical","analytical"]},
  {major:"生物科学",school:"武汉大学",score:635,province:"湖北",city:"武汉",industry:"biomed",reason:"武大生科院底蕴深厚，生物医药方向就业或深造俱佳",type:"冲刺",combos:["物化生"],traits:["analytical","social"]},
  {major:"微电子科学与工程",school:"西北工业大学",score:630,province:"陕西",city:"西安",industry:"semiconductor",reason:"985国防特色，微电子方向有海军工应用",type:"冲刺",combos:["物化生","物化地"],traits:["analytical","practical"]},
  {major:"机器人工程",school:"哈尔滨工业大学",score:645,province:"黑龙江",city:"哈尔滨",industry:"robot",reason:"哈工大机器人全国第一，就业大疆/航天",type:"冲刺",combos:["物化生","物化地"],traits:["practical","analytical"]},
  {major:"网络空间安全",school:"北京邮电大学",score:635,province:"北京",city:"北京",industry:"ai",reason:"北邮网安全国顶尖，就业奇安信/360/华为安全",type:"冲刺",combos:["物化生","物化政","物化地"],traits:["analytical","practical"]},

  // ---- 211核心档 (超一本40-80) ----
  {major:"人工智能",school:"西安电子科技大学",score:595,province:"陕西",city:"西安",industry:"ai",reason:"西电AI实力顶尖，就业华为/腾讯/字节",type:"冲刺",combos:["物化生","物化政","物化地"],traits:["analytical","creative"]},
  {major:"计算机科学与技术",school:"北京邮电大学",score:610,province:"北京",city:"北京",industry:"ai",reason:"计算机+通信顶尖211，北京互联网就业首选",type:"冲刺",combos:["物化生","物化政","物化地"],traits:["analytical","creative"]},
  {major:"集成电路设计与集成系统",school:"杭州电子科技大学",score:575,province:"浙江",city:"杭州",industry:"semiconductor",reason:"集成电路热门方向，长三角芯片企业就业",type:"稳妥",combos:["物化生","物化地"],traits:["analytical","practical"]},
  {major:"新能源科学与工程",school:"华北电力大学(保定)",score:562,province:"河北",city:"保定",industry:"newenergy",reason:"电力行业顶尖，新能源方向就业国家电网",type:"稳妥",combos:["物化生","物化地"],traits:["analytical","practical"]},
  {major:"车辆工程(智能汽车方向)",school:"合肥工业大学",score:560,province:"安徽",city:"合肥",industry:"auto",reason:"车辆工程顶尖211，智能汽车方向，就业比亚迪/蔚来",type:"稳妥",combos:["物化生","物化地"],traits:["practical","analytical"]},
  {major:"生物医学工程",school:"北京化工大学",score:558,province:"北京",city:"北京",industry:"biomed",reason:"211高校，生医工实力强，北京就业优势",type:"稳妥",combos:["物化生"],traits:["analytical","social"]},
  {major:"金融工程",school:"上海财经大学",score:618,province:"上海",city:"上海",industry:"finance",reason:"金融顶尖211，量化方向就业券商/基金",type:"冲刺",combos:["物化生","物化政","物化地"],traits:["analytical","leadership"]},
  {major:"机器人工程",school:"哈尔滨工程大学",score:555,province:"黑龙江",city:"哈尔滨",industry:"robot",reason:"船舶+机器人特色211，国防背景",type:"稳妥",combos:["物化生","物化地"],traits:["practical","analytical"]},
  {major:"飞行器设计与工程",school:"南京航空航天大学",score:568,province:"江苏",city:"南京",industry:"aerospace",reason:"航空特色211，就业航空工业集团",type:"稳妥",combos:["物化生","物化地"],traits:["analytical","practical"]},
  {major:"储能科学与工程",school:"中国石油大学(华东)",score:552,province:"山东",city:"青岛",industry:"newenergy",reason:"211高校，储能新兴方向，未来10年高潜力",type:"稳妥",combos:["物化生","物化地"],traits:["analytical"]},
  {major:"电子科学与技术",school:"福州大学",score:568,province:"福建",city:"福州",industry:"semiconductor",reason:"211，电子方向强，福建电子信息产业发达",type:"稳妥",combos:["物化生","物化地"],traits:["analytical","practical"]},
  {major:"新能源材料与器件",school:"武汉理工大学",score:565,province:"湖北",city:"武汉",industry:"newenergy",reason:"材料+新能源交叉，211性价比高",type:"稳妥",combos:["物化生"],traits:["analytical","practical"]},
  {major:"通信工程",school:"西南交通大学",score:570,province:"四川",city:"成都",industry:"ai",reason:"211，通信老牌强校，就业华为/中兴/运营商",type:"稳妥",combos:["物化生","物化地"],traits:["analytical"]},
  {major:"海洋工程与技术",school:"大连理工大学",score:572,province:"辽宁",city:"大连",industry:"newenergy",reason:"985，海洋+能源交叉，平台型大学",type:"稳妥",combos:["物化生","物化地"],traits:["analytical","practical"]},
  {major:"电子信息工程",school:"郑州大学",score:555,province:"河南",city:"郑州",industry:"semiconductor",reason:"211，中原地区电子强校，性价比高",type:"稳妥",combos:["物化生","物化地"],traits:["analytical","practical"]},
  {major:"智能制造工程",school:"北京工业大学",score:570,province:"北京",city:"北京",industry:"robot",reason:"211，智能制造新方向，北京就业",type:"稳妥",combos:["物化生","物化地"],traits:["practical","analytical"]},
  {major:"药学",school:"中国药科大学",score:585,province:"江苏",city:"南京",industry:"biomed",reason:"药科211王牌，药学就业强生/恒瑞/药监局",type:"稳妥",combos:["物化生"],traits:["social","analytical"]},

  // ---- 一本稳档 (超一本0-40) ----
  {major:"人工智能",school:"杭州电子科技大学",score:545,province:"浙江",city:"杭州",industry:"ai",reason:"AI应用型强校，地处杭州互联网腹地，就业极佳",type:"稳妥",combos:["物化生","物化地"],traits:["analytical","practical"]},
  {major:"软件工程",school:"天津工业大学",score:538,province:"天津",city:"天津",industry:"ai",reason:"双一流，软件工程就业广，天津/北京双城就业",type:"稳妥",combos:["物化生","物化政","物化地"],traits:["practical","creative"]},
  {major:"网络空间安全",school:"杭州电子科技大学",score:542,province:"浙江",city:"杭州",industry:"ai",reason:"网络安全热门方向，就业阿里/安全企业",type:"稳妥",combos:["物化生","物化地"],traits:["analytical","practical"]},
  {major:"电子科学与技术",school:"中北大学",score:505,province:"山西",city:"太原",industry:"semiconductor",reason:"兵工背景，微电子方向有特色，性价比高",type:"保底",combos:["物化生","物化地"],traits:["practical","analytical"]},
  {major:"新能源汽车工程",school:"江苏大学",score:530,province:"江苏",city:"镇江",industry:"auto",reason:"汽车工程强校，新能源方向，长三角就业",type:"稳妥",combos:["物化生","物化地"],traits:["practical","analytical"]},
  {major:"生物制药",school:"天津理工大学",score:520,province:"天津",city:"天津",industry:"biomed",reason:"生物制药新兴方向，京津冀医药企业就业",type:"稳妥",combos:["物化生"],traits:["analytical"]},
  {major:"药学",school:"山西医科大学",score:505,province:"山西",city:"太原",industry:"biomed",reason:"省内医学强校，药学就业医院/药企，稳定有意义",type:"保底",combos:["物化生","物化政"],traits:["social"]},
  {major:"自动化",school:"太原科技大学",score:498,province:"山西",city:"太原",industry:"robot",reason:"自动化传统方向，机器人转型，就业制造业",type:"保底",combos:["物化生","物化地"],traits:["practical","analytical"]},
  {major:"信息管理与信息系统",school:"太原理工大学",score:528,province:"山西",city:"太原",industry:"finance",reason:"211，管理+技术交叉，就业金融科技",type:"稳妥",combos:["物化生","物化政","物化地"],traits:["analytical","leadership"]},
  {major:"航空航天工程",school:"中北大学",score:500,province:"山西",city:"太原",industry:"aerospace",reason:"兵工背景，航空航天特色，就业航天企业",type:"保底",combos:["物化生","物化地"],traits:["practical","analytical"]},
  {major:"能源与动力工程",school:"太原理工大学",score:522,province:"山西",city:"太原",industry:"newenergy",reason:"211，能源方向传统强项，转型新能源有优势",type:"保底",combos:["物化生","物化地"],traits:["practical"]},
  {major:"机器人工程",school:"安徽工程大学",score:510,province:"安徽",city:"合肥",industry:"robot",reason:"机器人新兴专业，安徽工业机器人产业发达",type:"稳妥",combos:["物化生","物化地"],traits:["practical","creative"]},
  {major:"医疗器械工程",school:"上海理工大学",score:535,province:"上海",city:"上海",industry:"medical",reason:"医疗器械强校，上海就业优势",type:"稳妥",combos:["物化生"],traits:["analytical","practical"]},
  {major:"计算机科学与技术",school:"西安邮电大学",score:536,province:"陕西",city:"西安",industry:"ai",reason:"计算机热门院校，就业西安/北京/深圳互联网",type:"稳妥",combos:["物化生","物化政","物化地"],traits:["analytical","creative"]},
  {major:"智能科学与技术",school:"太原理工大学",score:520,province:"山西",city:"太原",industry:"ai",reason:"省内211，保研机会多，性价比高",type:"保底",combos:["物化生","物化地"],traits:["analytical","practical"]},
  {major:"数据科学与大数据技术",school:"山西大学",score:515,province:"山西",city:"太原",industry:"ai",reason:"省内双一流，大数据方向，就业面广",type:"保底",combos:["物化生","物化地"],traits:["analytical"]},
  {major:"金融工程",school:"山西财经大学",score:508,province:"山西",city:"太原",industry:"finance",reason:"省内金融强校，量化方向，就业银行/证券",type:"保底",combos:["物化生","物化政","物化地"],traits:["analytical","social"]},
  {major:"汽车服务工程",school:"中北大学",score:495,province:"山西",city:"太原",industry:"auto",reason:"省内保底，汽车产业转型方向",type:"保底",combos:["物化生","物化地"],traits:["practical"]},
  {major:"电气工程及其自动化",school:"沈阳工业大学",score:525,province:"辽宁",city:"沈阳",industry:"newenergy",reason:"电气强校，东北老牌工科，新能源+电网就业",type:"稳妥",combos:["物化生","物化地"],traits:["practical"]},
  {major:"通信工程",school:"西安邮电大学",score:532,province:"陕西",city:"西安",industry:"ai",reason:"通信特色院校，就业华为/中兴/运营商",type:"稳妥",combos:["物化生","物化地"],traits:["analytical"]},
  {major:"生物技术",school:"湖南农业大学",score:510,province:"湖南",city:"长沙",industry:"biomed",reason:"生物技术方向，对接生物医药产业链",type:"保底",combos:["物化生"],traits:["analytical"]},
  {major:"大数据管理与应用",school:"广东财经大学",score:515,province:"广东",city:"广州",industry:"finance",reason:"财经院校大数据方向，广深就业",type:"稳妥",combos:["物化生","物化政"],traits:["analytical","leadership"]},
  {major:"数字媒体技术",school:"浙江传媒学院",score:505,province:"浙江",city:"杭州",industry:"media",reason:"数字创意方向，杭州文创产业发达",type:"保底",combos:["物化生","物化政","物生地"],traits:["creative"]},

  // ---- 一本冲档 (低于一本0-30) ----
  {major:"软件工程",school:"太原科技大学",score:488,province:"山西",city:"太原",industry:"ai",reason:"省内保底，软件工程就业广",type:"保底",combos:["物化生","物化地"],traits:["practical","creative"]},
  {major:"电气工程及其自动化",school:"沈阳工业大学",score:490,province:"辽宁",city:"沈阳",industry:"newenergy",reason:"电气强校，新能源+电网就业",type:"保底",combos:["物化生","物化地"],traits:["practical"]},
  {major:"电子信息工程",school:"长春理工大学",score:492,province:"吉林",city:"长春",industry:"semiconductor",reason:"光电特色，电子方向就业半导体企业",type:"保底",combos:["物化生","物化地"],traits:["analytical","practical"]},
  {major:"制药工程",school:"河北科技大学",score:485,province:"河北",city:"石家庄",industry:"biomed",reason:"制药方向，京津冀药企就业",type:"保底",combos:["物化生"],traits:["analytical","social"]},
  {major:"机械设计制造及其自动化",school:"河南科技大学",score:488,province:"河南",city:"洛阳",industry:"robot",reason:"机械强校，机器人转型方向",type:"保底",combos:["物化生","物化地"],traits:["practical"]},
  {major:"飞行器制造工程",school:"沈阳航空航天大学",score:495,province:"辽宁",city:"沈阳",industry:"aerospace",reason:"航空特色院校，就业航空工业",type:"稳妥",combos:["物化生","物化地"],traits:["practical","analytical"]},
  {major:"土木工程",school:"兰州理工大学",score:480,province:"甘肃",city:"兰州",industry:"env",reason:"土木传统强校，西北建设需求大",type:"保底",combos:["物化生"],traits:["practical"]},
  {major:"新能源材料与器件",school:"河南理工大学",score:485,province:"河南",city:"焦作",industry:"newenergy",reason:"材料强校，新能源材料方向",type:"保底",combos:["物化生"],traits:["analytical"]},
  {major:"电子信息科学与技术",school:"昆明理工大学",score:483,province:"云南",city:"昆明",industry:"semiconductor",reason:"西南工科强校，电子类就业本地/深圳",type:"保底",combos:["物化生","物化地"],traits:["analytical","practical"]},
  {major:"轨道交通信号与控制",school:"兰州交通大学",score:478,province:"甘肃",city:"兰州",industry:"robot",reason:"铁道特色院校，轨道交通自动化",type:"保底",combos:["物化生","物化地"],traits:["practical"]},

  // ---- 二本核心档 ----
  {major:"计算机科学与技术",school:"太原工业学院",score:460,province:"山西",city:"太原",industry:"ai",reason:"省内二本，计算机方向就业可去本地IT企业",type:"保底",combos:["物化生","物化地"],traits:["practical"]},
  {major:"电气工程及其自动化",school:"运城学院",score:445,province:"山西",city:"运城",industry:"newenergy",reason:"省内二本，电气方向可考国网",type:"保底",combos:["物化生","物化地"],traits:["practical"]},
  {major:"数据科学与大数据技术",school:"长治学院",score:440,province:"山西",city:"长治",industry:"ai",reason:"省内二本，大数据方向，考研/就业均可",type:"保底",combos:["物化生","物化地"],traits:["analytical"]},
  {major:"机械电子工程",school:"湖南工学院",score:455,province:"湖南",city:"衡阳",industry:"robot",reason:"机电方向，机器人产业应用",type:"保底",combos:["物化生","物化地"],traits:["practical"]},
  {major:"食品科学与工程",school:"青岛农业大学",score:450,province:"山东",city:"青岛",industry:"biomed",reason:"食品科学方向，对接食品工业",type:"保底",combos:["物化生"],traits:["analytical"]},
  {major:"软件工程",school:"南昌理工学院",score:448,province:"江西",city:"南昌",industry:"ai",reason:"软件方向，毕业可去南昌/深圳IT",type:"保底",combos:["物化生","物化地"],traits:["practical"]},
  {major:"生物工程",school:"湖北工业大学",score:465,province:"湖北",city:"武汉",industry:"biomed",reason:"生物工程方向，武汉生物城就业",type:"保底",combos:["物化生"],traits:["analytical"]},
  {major:"新能源科学与工程",school:"辽宁科技大学",score:458,province:"辽宁",city:"鞍山",industry:"newenergy",reason:"钢铁+新能源转型，东北就业",type:"保底",combos:["物化生","物化地"],traits:["practical"]},
  {major:"物联网工程",school:"郑州轻工业大学",score:462,province:"河南",city:"郑州",industry:"ai",reason:"物联网新兴专业，郑州本地IT就业",type:"保底",combos:["物化生","物化地"],traits:["analytical","practical"]},
  {major:"医学检验技术",school:"新乡医学院",score:460,province:"河南",city:"新乡",industry:"biomed",reason:"医学检验方向，医院/第三方检验就业",type:"保底",combos:["物化生"],traits:["social"]},

  // ---- 额外热门专业（高分段补充）----
  {major:"临床医学(五年制)",school:"郑州大学",score:600,province:"河南",city:"郑州",industry:"biomed",reason:"211医学院，中原地区医学强校",type:"稳妥",combos:["物化生"],traits:["social","analytical"]},
  {major:"口腔医学",school:"武汉大学",score:650,province:"湖北",city:"武汉",industry:"biomed",reason:"口腔顶尖，就业收入高，专业性强",type:"冲刺",combos:["物化生"],traits:["social","practical"]},
  {major:"微电子科学与工程",school:"西安电子科技大学",score:598,province:"陕西",city:"西安",industry:"semiconductor",reason:"微电子顶尖院校，芯片设计就业海思/中芯",type:"冲刺",combos:["物化生","物化地"],traits:["analytical","practical"]},
  {major:"电子信息工程",school:"电子科技大学",score:640,province:"四川",city:"成都",industry:"semiconductor",reason:"电子类顶尖985，就业华为/大疆",type:"冲刺",combos:["物化生","物化地"],traits:["analytical","practical"]},
  {major:"新能源材料与器件",school:"武汉理工大学",score:565,province:"湖北",city:"武汉",industry:"newenergy",reason:"材料+新能源交叉，211性价比高",type:"稳妥",combos:["物化生"],traits:["analytical","practical"]},
  {major:"智能制造工程",school:"北京工业大学",score:570,province:"北京",city:"北京",industry:"robot",reason:"211，智能制造新方向，北京就业",type:"稳妥",combos:["物化生","物化地"],traits:["practical","analytical"]},
  {major:"数字经济",school:"湖南大学",score:590,province:"湖南",city:"长沙",industry:"finance",reason:"985，数字经济新兴方向，金融+数据",type:"稳妥",combos:["物化生","物化政","物化地"],traits:["leadership","analytical"]},
  {major:"应用心理学",school:"华南师范大学",score:555,province:"广东",city:"广州",industry:"media",reason:"211，心理学方向，心理咨询/HR",type:"稳妥",combos:["物化生","物化政","物生政"],traits:["social"]},
  {major:"能源互联网",school:"重庆大学",score:580,province:"重庆",city:"重庆",industry:"newenergy",reason:"985，能源+互联网交叉前沿",type:"稳妥",combos:["物化生","物化地"],traits:["analytical","practical"]},
  {major:"智能科学与技术",school:"华南理工大学",score:625,province:"广东",city:"广州",industry:"ai",reason:"985工科强校，智能方向大湾区就业",type:"冲刺",combos:["物化生","物化地"],traits:["analytical","practical"]},
  {major:"建筑学(五年制)",school:"湖南大学",score:585,province:"湖南",city:"长沙",industry:"media",reason:"建筑老四校之一，设计方向",type:"稳妥",combos:["物化生","物化地","物生地"],traits:["creative"]},
  {major:"统计学",school:"华东师范大学",score:620,province:"上海",city:"上海",industry:"finance",reason:"985师范，统计学强，就业金融科技/互联网数据分析",type:"冲刺",combos:["物化生","物化政"],traits:["analytical","social"]},
  {major:"船舶与海洋工程",school:"大连理工大学",score:575,province:"辽宁",city:"大连",industry:"env",reason:"造船+海洋工程，大连船舶重工就业",type:"稳妥",combos:["物化生","物化地"],traits:["practical","analytical"]},
  {major:"护理学",school:"中南大学",score:580,province:"湖南",city:"长沙",industry:"biomed",reason:"湘雅护理全国顶尖，三甲医院就业",type:"稳妥",combos:["物化生","物化政"],traits:["social"]},
  {major:"环境工程",school:"山东大学",score:590,province:"山东",city:"济南",industry:"env",reason:"985，环境方向+双碳政策受益",type:"稳妥",combos:["物化生"],traits:["analytical","social"]},
  {major:"工业设计",school:"江南大学",score:565,province:"江苏",city:"无锡",industry:"media",reason:"设计王牌，工业设计+交互设计就业广",type:"稳妥",combos:["物化生","物生地"],traits:["creative"]},
];

const SLIDER_LABELS={
  salary:["中等水平，够花就好","安全感足，日常宽松","有一定积蓄，能追点小爱好","可以有不错的储蓄和投资空间","相当可观的收入水平"],
  stability:["完全倾向创业公司","偏创业公司","各有所长","偏大企业","完全倾向大企业"],
  growth:["必须有人带","偏有人带","两者结合","偏自己探索","自己探索为主"],
  meaning:["APP更有意义","偏APP意义","两者都有意义","偏新药意义","新药更有意义"]
};

// ===== FUNCTIONS =====

function showToast(msg){
  const t=document.getElementById("toast");
  t.textContent=msg;t.classList.remove("hidden");
  setTimeout(()=>t.classList.add("hidden"),2200);
}

function updateProgress(step){
  const pct=Math.round(step/(STEPS+1)*100);
  document.getElementById("progressFill").style.width=pct+"%";
  document.getElementById("progressPct").textContent=pct+"%";
  const labels=["准备开始","基本信息","生活场景","学科兴趣","职业价值观","行业偏好"];
  document.getElementById("progressLabel").textContent=labels[step]||"生成报告中...";
}

function showStep(n){
  document.querySelectorAll(".card").forEach(c=>c.classList.add("hidden"));
  const el=document.getElementById("step-"+n);
  if(el){el.classList.remove("hidden");el.style.animation="none";void el.offsetHeight;el.style.animation="cardIn 0.5s ease-out";}
  currentStep=n;updateProgress(n);window.scrollTo({top:0,behavior:"smooth"});
  if(n===2)updateQ2Dots();
}

function goStep(n){
  if(currentStep===1){
    const prov=document.getElementById("userProvince");
    if(!prov||!prov.value){showToast("请选择你的省份");return;}
    answers.province=prov.value;
    answers.subjectCombo=document.getElementById("userSubjectCombo")?.value||"物化生";
    answers.rankMode=document.querySelector('input[name="rankMode"]:checked')?.value||"score";
    if(answers.rankMode==="score"){
      answers.score=parseInt(document.getElementById("userScore")?.value)||0;
      if(answers.score<200||answers.score>800){showToast("请输入合理的分数（200-800）");return;}
    } else {
      answers.rank=parseInt(document.getElementById("userRank")?.value)||0;
      if(answers.rank<100||answers.rank>500000){showToast("请输入合理的省排名（100-500000）");return;}
      // 根据省排名估算等效分数
      answers.score=estimateScoreFromRank(answers.province,answers.rank);
    }
    answers.name=document.getElementById("userName")?.value||"同学";
  }
  if(currentStep===2){
    const answered=Object.keys(answers.q2answers).length;
    if(answered<8){showToast("请回答全部 8 道题（还差"+(8-answered)+"道）");return;}
  }
  if(currentStep===3){
    if(Object.keys(answers.q3answers).length===0){showToast("请至少回答一道题");return;}
  }
  if(n===5){
    answers.values={
      salary:parseInt(document.getElementById("slider-salary").value),
      stability:parseInt(document.getElementById("slider-stability").value),
      growth:parseInt(document.getElementById("slider-growth").value),
      meaning:parseInt(document.getElementById("slider-meaning").value)
    };
  }
  showStep(n);
}

// 省排名→等效分数（简化估算）
function estimateScoreFromRank(province,rank){
  const ref=SCORE_REF[province];
  if(!ref) return 500;
  // 简化：根据排名估算分数
  // 一本线对应排名约前15-20%，用对数模型
  const total=ref.total;
  const yiben=ref.yiben;
  if(rank<=1000) return Math.min(yiben+120, total-10);
  if(rank<=5000) return yiben+80;
  if(rank<=15000) return yiben+40;
  if(rank<=30000) return yiben;
  if(rank<=60000) return yiben-30;
  if(rank<=100000) return yiben-60;
  return yiben-90;
}

// 动态更新分数档提示
function updateScoreHint(){
  const mode=document.querySelector('input[name="rankMode"]:checked')?.value||"score";
  const hintEl=document.getElementById("scoreHint");
  if(!hintEl) return;
  if(mode==="score"){
    const score=parseInt(document.getElementById("userScore")?.value)||0;
    const province=document.getElementById("userProvince")?.value||"";
    if(score>0 && province){
      const tier=getScoreTier(province,score);
      hintEl.innerHTML='<span style="color:var(--accent)">📐 '+tier.label+'</span>';
    } else {
      hintEl.innerHTML='<span style="color:var(--text-dim)">选择省份并输入分数后，自动判断分档</span>';
    }
  } else {
    const rank=parseInt(document.getElementById("userRank")?.value)||0;
    const province=document.getElementById("userProvince")?.value||"";
    if(rank>0 && province){
      const estScore=estimateScoreFromRank(province,rank);
      const tier=getScoreTier(province,estScore);
      hintEl.innerHTML='<span style="color:var(--accent)">📐 等效约'+estScore+'分 · '+tier.label+'</span>';
    } else {
      hintEl.innerHTML='<span style="color:var(--text-dim)">选择省份并输入排名后，自动估算分档</span>';
    }
  }
}

function toggleTag(btn,key){
  btn.classList.toggle("selected");
  const v=btn.dataset.val;
  if(answers[key].includes(v))answers[key]=answers[key].filter(x=>x!==v);
  else answers[key].push(v);
}

function toggleReject(btn,key){
  btn.classList.toggle("rejected");
  const v=btn.dataset.val;
  if(answers[key].includes(v))answers[key]=answers[key].filter(x=>x!==v);
  else answers[key].push(v);
}

function toggleIndustryCard(card){
  const key=card.dataset.val;
  if(card.classList.contains("rejected")){
    card.classList.remove("rejected");card.classList.add("selected");
    answers.industries.push(key);answers.industries=[...new Set(answers.industries)];answers.industryMode[key]="selected";
  } else if(card.classList.contains("selected")){
    card.classList.remove("selected");card.classList.add("rejected");
    answers.industries=answers.industries.filter(x=>x!==key);
    if(!answers.rejectIndustries.includes(key))answers.rejectIndustries.push(key);answers.industryMode[key]="rejected";
  } else {
    card.classList.add("selected");answers.industries.push(key);answers.industries=[...new Set(answers.industries)];answers.industryMode[key]="selected";
  }
}

function selectScenario(btn){
  const qNum=parseInt(btn.dataset.q);
  btn.parentElement.querySelectorAll(".scenario-opt").forEach(b=>b.classList.remove("selected"));
  btn.classList.add("selected");
  answers.q2answers[qNum]=btn.dataset.val;
  const answered=Object.keys(answers.q2answers).length;
  document.getElementById("q2-next").disabled=answered<8;
  document.getElementById("q2-next").textContent=answered<8?"还差"+(8-answered)+"题 →":"下一步 →";
  updateQ2Dots();
}

function updateQ2Dots(){
  const dots=document.getElementById("q2-dots");
  if(!dots)return;dots.innerHTML="";
  for(let i=1;i<=8;i++){const d=document.createElement("div");d.className="q-dot"+(answers.q2answers[i]?" done":"");dots.appendChild(d);}
}

function selectSubj(btn){
  const qNum=btn.dataset.q;
  btn.parentElement.querySelectorAll(".scenario-opt").forEach(b=>b.classList.remove("selected"));
  btn.classList.add("selected");
  answers.q3answers[qNum]=btn.dataset.val;
  document.getElementById("q3-next").disabled=Object.keys(answers.q3answers).length===0;
}

function updateSlider(key){
  const val=parseInt(document.getElementById("slider-"+key).value);
  document.getElementById("val-"+key).textContent=val;
  const labels=SLIDER_LABELS[key];
  const idx=Math.round(val/25);
  document.getElementById("label-"+key).textContent=labels?labels[Math.min(idx,labels.length-1)]||labels[0]:"";
}

function calcPersonality(){
  Object.keys(PERSONALITY_SCORES).forEach(k=>PERSONALITY_SCORES[k]=0);
  for(const[qNum,val]of Object.entries(answers.q2answers)){
    const qKey=parseInt(qNum);
    if(PERSONALITY_SCORING[qKey]&&PERSONALITY_SCORING[qKey][val]){
      const{t,s}=PERSONALITY_SCORING[qKey][val];PERSONALITY_SCORES[t]+=s;
    }
  }
  const sorted=Object.entries(PERSONALITY_SCORES).sort((a,b)=>b[1]-a[1]);
  return sorted[0][0];
}

function generateResult(){
  if(answers.industries.length===0){showToast("请至少选择一个感兴趣的行业");return;}
  answers.name=document.getElementById("userName")?.value||"同学";
  // Re-read score/rank in case user changed
  answers.rankMode=document.querySelector('input[name="rankMode"]:checked')?.value||"score";
  if(answers.rankMode==="score"){
    answers.score=parseInt(document.getElementById("userScore")?.value)||550;
  }
  document.querySelectorAll(".card").forEach(c=>c.classList.add("hidden"));
  document.getElementById("step-loading").classList.remove("hidden");
  updateProgress(STEPS+1);window.scrollTo({top:0,behavior:"smooth"});
  const msgs=["正在分析性格特质...","正在匹配最适合的学科方向...","正在评估未来10年行业前景...","正在筛选匹配分数段的院校专业...","正在生成个性化志愿报告..."];
  let i=0;const iv=setInterval(()=>{if(i<msgs.length){document.getElementById("loadingText").textContent=msgs[i];i++;}else clearInterval(iv);},600);
  setTimeout(()=>{clearInterval(iv);renderResult();},3200);
}

function getValueInterpret(v){
  const tops=Object.entries(v).sort((a,b)=>b[1]-a[1]);
  const nameMap={salary:"薪资",stability:"稳定",growth:"成长",meaning:"意义"};
  const first=nameMap[tops[0][0]];
  if(tops[0][1]>=70){
    let suggestion;
    if(first==="薪资"||first==="成长"){
      suggestion="一线城市和新锐行业，能更快获得高收入和快速成长";
    } else if(first==="稳定"){
      suggestion="211/985高校和体制内方向，稳定性高";
    } else {
      suggestion="和你价值观契合的专业和行业，工作中才会有持续的动力";
    }
    return "你最看重<strong>「"+first+"」</strong>，说明你对未来有清晰的方向感。建议优先考虑"+suggestion+"。";
  }
  return "你的职业价值观比较均衡，这是一个很好的特质。建议多和不同行业的前辈聊聊，再逐步明确自己的优先级。";
}

function renderResult(){
  const personalityKey=calcPersonality();
  const persona=PERSONALITY_TYPES[personalityKey]||PERSONALITY_TYPES.analytical;
  const scoreTier=getScoreTier(answers.province,answers.score);
  const combo=answers.subjectCombo;

  // 筛选匹配的专业：分数±30 + 行业匹配 + 选科兼容 + 城市偏好 + 排除
  let matched=MAJOR_DB.filter(m=>{
    const scoreMatch=Math.abs(m.score-answers.score)<=30;
    const industryMatch=answers.industries.includes(m.industry);
    const rejectIndustry=answers.rejectIndustries&&answers.rejectIndustries.includes(m.industry);
    const comboMatch=!m.combos||m.combos.length===0||m.combos.includes(combo);
    const rejectMajor=answers.rejectMajors&&answers.rejectMajors.some(rm=>m.major.includes(rm));
    if(rejectIndustry||rejectMajor)return false;
    if(!comboMatch)return false;
    // 城市偏好：如果选了具体城市（非"无所谓"），优先匹配意向城市
    const hasSpecificCities=answers.cities.length>0 && !answers.cities.includes("无所谓");
    if(hasSpecificCities){
      if(!answers.cities.includes(m.city))return false;
    }
    // 排除城市
    if(answers.rejectCities&&answers.rejectCities.includes(m.city))return false;
    return scoreMatch&&industryMatch;
  });

  // 如果匹配太少，放宽条件
  if(matched.length<3){
    matched=MAJOR_DB.filter(m=>{
      const comboMatch=!m.combos||m.combos.length===0||m.combos.includes(combo);
      const rejectIndustry=answers.rejectIndustries&&answers.rejectIndustries.includes(m.industry);
      const rejectMajor=answers.rejectMajors&&answers.rejectMajors.some(rm=>m.major.includes(rm));
      if(rejectIndustry||rejectMajor)return false;
      if(answers.rejectCities&&answers.rejectCities.includes(m.city))return false;
      return comboMatch;
    }).sort((a,b)=>Math.abs(a.score-answers.score)-Math.abs(b.score-answers.score)).slice(0,10);
  }

  const seen=new Set();matched=matched.filter(m=>{const k=m.school+m.major;if(seen.has(k))return false;seen.add(k);return true;}).slice(0,8);

  const userIndustries=answers.industries.map(k=>INDUSTRY_DATA[k]).filter(Boolean);
  const v=answers.values;
  let html="";

  // Header
  const scoreDisplay=answers.rankMode==="rank"?"省排名约"+answers.rank+"名（等效约"+answers.score+"分）":answers.score+"分";
  html+='<div class="result-header"><div class="result-avatar">'+persona.icon+'</div><div class="result-name">'+answers.name+'的志愿方案</div><div class="result-type">'+persona.name+' · '+answers.province+' · '+combo+' · '+scoreDisplay+'</div><div class="result-desc">'+persona.desc+'</div></div>';

  // Personality traits
  html+='<div class="result-section"><div class="result-section-title"><span class="dot"></span>性格特质分析</div><div class="card"><div style="font-size:13px;color:var(--text-dim);margin-bottom:14px">根据你在生活中的 8 道选择题推断得出</div><div class="trait-bars">';
  const traitNames={analytical:"\ud83d\udd2c 分析研究",creative:"\ud83c\udfa8 创新创造",social:"\ud83e\udd1d 社交交往",practical:"\ud83d\udd27 实践动手",leadership:"\ud83d\udc51 组织影响"};
  const traitColors={analytical:"var(--accent2),var(--accent)",creative:"var(--accent),var(--accent3)",social:"var(--accent3),#69f0ae",practical:"var(--gold),#ffb300",leadership:"#e040fb,#aa00ff"};
  const maxScore=Math.max(...Object.values(PERSONALITY_SCORES),1);
  for(const[type,score]of Object.entries(PERSONALITY_SCORES)){
    const pct=Math.round(score/maxScore*100);const isTop=(type===personalityKey);
    html+='<div style="'+(isTop?"opacity:1":"opacity:0.7")+'"><div class="trait-bar-label"><span class="trait-bar-name">'+traitNames[type]+(isTop?" \u2605 主要特质":"")+'</span><span class="trait-bar-val">'+score+'分</span></div><div class="trait-bar-track"><div class="trait-bar-fill" style="width:'+pct+'%;background:linear-gradient(90deg,'+traitColors[type]+')"></div></div></div>';
  }
  html+='</div></div></div>';

  // Values
  html+='<div class="result-section"><div class="result-section-title"><span class="dot"></span>职业价值观画像</div><div class="card"><div class="trait-bars">';
  const valNames={salary:"\ud83d\udcb0 薪资期待",stability:"\ud83d\udee1\ufe0f 工作稳定",growth:"\ud83d\udcc8 成长空间",meaning:"\u2b50 意义与成就感"};
  const valColors={salary:"#ff5252,#ff8a80",stability:"#448aff,#82b1ff",growth:"var(--accent2),var(--accent)",meaning:"var(--accent3),#69f0ae"};
  for(const[key,val]of Object.entries(v)){
    html+='<div><div class="trait-bar-label"><span class="trait-bar-name">'+valNames[key]+'</span><span class="trait-bar-val">'+val+'分</span></div><div class="trait-bar-track"><div class="trait-bar-fill" style="width:'+val+'%;background:linear-gradient(90deg,'+valColors[key]+')"></div></div></div>';
  }
  html+='<div style="margin-top:16px;padding:14px 18px;background:rgba(255,215,64,.08);border:1px solid rgba(255,215,64,.2);border-radius:12px;font-size:13px;color:var(--gold);line-height:1.7">\ud83d\udca1 <strong>\u89e3\u8bfb\uff1a</strong>'+getValueInterpret(v)+'</div></div></div>';

  // Industries
  if(userIndustries.length>0){
    html+='<div class="result-section"><div class="result-section-title"><span class="dot"></span>你关注行业的未来10年前景</div>';
    userIndustries.forEach(ind=>{
      html+='<div class="industry-card"><div class="industry-icon" style="background:'+(ind.trend==="up"?"rgba(105,240,174,.15)":"rgba(255,215,64,.15)")+'">'+(ind.trend==="up"?"\ud83d\udcc8":"\u27a1\ufe0f")+'</div><div style="flex:1"><div class="industry-name">'+ind.name+'<span class="industry-trend '+(ind.trend==="up"?"trend-up":"trend-stable")+'">'+(ind.trend==="up"?"上升通道":"稳定增长")+'</span></div><div class="industry-desc">'+ind.desc+'</div><div style="margin-top:10px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px"><span>未来10年潜力指数</span><span style="color:var(--accent);font-weight:700">'+ind.score+'分</span></div><div style="height:6px;border-radius:3px;background:rgba(255,255,255,.06)"><div style="height:100%;border-radius:3px;width:'+ind.score+'%;background:linear-gradient(90deg,var(--accent2),var(--accent));transition:width 1.2s"></div></div></div></div></div>';
    });
    html+='</div>';
  }

  // Recommendations
  html+='<div class="result-section"><div class="result-section-title"><span class="dot"></span>为你推荐的院校与专业</div><div style="font-size:13px;color:var(--text-dim);margin-bottom:16px">综合你的性格（'+persona.name+'）、学科兴趣和行业偏好，针对'+answers.province+scoreTier.tier+'匹配</div>';
  matched.forEach((m,idx)=>{
    const matchScore=Math.max(62,100-Math.abs(m.score-answers.score)*2+Math.floor(Math.random()*8));
    const typeBg=m.type==="冲刺"?"rgba(255,82,82,.15)":m.type==="稳妥"?"rgba(255,215,64,.15)":"rgba(105,240,174,.15)";
    const typeClr=m.type==="冲刺"?"var(--danger)":m.type==="稳妥"?"var(--gold)":"var(--success)";
    const typeIcon=m.type==="冲刺"?"\u26a1":m.type==="稳妥"?"\u2705":"\ud83d\udee1\ufe0f";
    const indData=INDUSTRY_DATA[m.industry];
    html+='<div class="rec-card"><div class="rec-rank">'+(idx+1)+'</div><div class="rec-major">'+m.major+'</div><div class="rec-school">\ud83c\udfeb '+m.school+'\uff08'+m.province+'\uff09</div><div class="rec-meta"><span>\ud83d\udcca 近年录取约 '+m.score+' 分</span><span>\ud83c\udfaf 匹配度 '+matchScore+'%</span></div><div class="score-match"><span style="font-size:20px">'+typeIcon+'</span><span style="color:var(--text-dim)">你的分数 <strong style="color:var(--accent)">'+answers.score+'</strong> \u00b7 该校近年 <strong style="color:var(--accent)">'+m.score+'</strong> 分 \u00b7 <strong style="color:var(--accent)">'+m.type+'志愿</strong></span></div><div class="rec-tags"><span class="rec-tag">'+(indData?indData.name:m.industry)+'</span><span class="rec-tag" style="background:'+typeBg+';color:'+typeClr+'">'+m.type+'档</span></div><div class="rec-reason">\ud83d\udca1 '+m.reason+'</div></div>';
  });
  html+='</div>';

  // Action plan
  html+='<div class="result-section"><div class="result-section-title"><span class="dot"></span>接下来你可以做什么</div><div class="card"><div style="display:flex;flex-direction:column;gap:14px">';
  const actionSteps=[
    {n:"1",bg:"rgba(0,229,255,.15)",title:"查官网确认选科要求",desc:"去各高校本科招生网，确认"+combo+"组合是否符合专业要求"},
    {n:"2",bg:"rgba(124,77,255,.15)",title:"了解专业真实内容",desc:'去知乎/B站搜索"'+(matched[0]?matched[0].major:"专业")+' 真实就读体验"，避免望文生义'},
    {n:"3",bg:"rgba(0,255,180,.15)",title:"关注一分一段表",desc:"高考出分后，根据"+answers.province+"一分一段表将分数转换为位次，再对照往年录取位次"},
    {n:"4",bg:"rgba(255,215,64,.15)",title:"设置冲稳保志愿梯度",desc:"冲刺（高5-15分）+ 稳妥（\u00b15分）+ 保底（低10-20分），各档2-3所"}
  ];
  actionSteps.forEach(s=>{
    html+='<div style="display:flex;gap:12px;align-items:flex-start"><div style="width:32px;height:32px;border-radius:50%;background:'+s.bg+';display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0">'+s.n+'</div><div><div style="font-weight:600;font-size:14px;margin-bottom:2px">'+s.title+'</div><div style="font-size:12px;color:var(--text-dim)">'+s.desc+'</div></div></div>';
  });
  html+='</div></div></div>';

  // Disclaimer
  html+='<div style="text-align:center;padding:20px 0 10px;font-size:11px;color:rgba(255,255,255,.3);line-height:1.6">\u26a0\ufe0f 以上推荐仅供参考，录取分数线每年波动，请以各省教育考试院和高校官方发布为准。<br>建议结合位次、选科要求、专业真实情况综合判断。</div>';

  // Restart + Export
  html+='<div class="restart-wrap" style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button class="btn btn-primary" onclick="exportResult()" style="background:linear-gradient(135deg,#ffd740,#ff9100);color:#05051a;box-shadow:0 4px 20px rgba(255,215,64,.3)">\ud83d\udcf8 导出保存</button><button class="btn btn-back" onclick="location.reload()">\ud83d\udd04 重新测试</button></div>';

  document.getElementById("result-page").classList.remove("hidden");
  document.getElementById("result-page").innerHTML=html;
  document.getElementById("step-loading").classList.add("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
}

// Init starfield
(function initStars(){
  const sf=document.getElementById("starfield");
  for(let i=0;i<180;i++){
    const s=document.createElement("div");s.className="star";
    const size=Math.random()*2.2+0.3;
    s.style.cssText="width:"+size+"px;height:"+size+"px;top:"+(Math.random()*100)+"%;left:"+(Math.random()*100)+"%;--dur:"+(Math.random()*3+1).toFixed(1)+"s;animation-delay:"+(Math.random()*5).toFixed(1)+"s;opacity:"+(Math.random()*0.7+0.1);
    sf.appendChild(s);
  }
})();

// Bind start button
 document.getElementById("startBtn").addEventListener("click",function(){goStep(1);});

// Fill province dropdown
(function(){
  const sel=document.getElementById("userProvince");
  if(!sel)return;
  PROVINCES.forEach(p=>{const o=document.createElement("option");o.value=p;o.textContent=p;sel.appendChild(o);});
})();

// Toggle score/rank mode
function toggleRankMode(){
  const mode=document.querySelector('input[name="rankMode"]:checked')?.value||"score";
  const scoreWrap=document.getElementById("scoreInputWrap");
  const rankWrap=document.getElementById("rankInputWrap");
  const scoreLabel=document.getElementById("modeScoreLabel");
  const rankLabel=document.getElementById("modeRankLabel");
  if(mode==="score"){
    scoreWrap.style.display="";rankWrap.style.display="none";
    scoreLabel.style.borderColor="var(--accent2)";scoreLabel.style.background="rgba(124,77,255,.1)";
    rankLabel.style.borderColor="rgba(255,255,255,.1)";rankLabel.style.background="transparent";
  } else {
    scoreWrap.style.display="none";rankWrap.style.display="";
    rankLabel.style.borderColor="var(--accent2)";rankLabel.style.background="rgba(124,77,255,.1)";
    scoreLabel.style.borderColor="rgba(255,255,255,.1)";scoreLabel.style.background="transparent";
  }
  updateScoreHint();
}
// Init mode style
toggleRankMode();

// ===== 导出结果功能 =====
function exportResult(){
  const resultPage=document.getElementById("result-page");
  if(!resultPage||resultPage.classList.contains("hidden")){
    showToast("请先完成测评生成报告");
    return;
  }

  // Show loading toast
  showToast("正在生成导出图片...");

  // Check if html2canvas is available
  if(typeof html2canvas==="undefined"){
    // Fallback: try to load it
    const script=document.createElement("script");
    script.src="https://html2canvas.hertzen.com/dist/html2canvas.min.js";
    script.onload=function(){doExport(resultPage);};
    script.onerror=function(){
      showToast("图片导出加载失败，请检查网络连接后重试");
    };
    document.head.appendChild(script);
    return;
  }
  doExport(resultPage);
}

function doExport(resultPage){
  // Hide the export/restart buttons temporarily for clean capture
  const btns=resultPage.querySelector(".restart-wrap");
  if(btns)btns.style.display="none";

  // Capture with html2canvas
  html2canvas(resultPage,{
    backgroundColor:"#05051a",
    scale:2,
    logging:false,
    useCORS:true,
    allowTaint:true
  }).then(function(canvas){
    // Restore buttons
    if(btns)btns.style.display="";

    // Generate filename
    const name=answers.name||"同学";
    const now=new Date();
    const dateStr=now.getFullYear()+""+(now.getMonth()+1).toString().padStart(2,"0")+now.getDate().toString().padStart(2,"0");
    const filename=name+"_高考志愿规划_"+dateStr+".png";

    // Trigger download
    const link=document.createElement("a");
    link.download=filename;
    link.href=canvas.toDataURL("image/png");
    link.click();

    showToast("\u2705 报告已保存为图片！");
  }).catch(function(e){
    if(btns)btns.style.display="";
    console.error("Export error:",e);
    showToast("导出失败，请尝试截图保存");
  });
}
