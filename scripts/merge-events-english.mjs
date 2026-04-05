/**
 * 將 dateZh / titleEn / bodyEn 合併進 data/events.json（對齊英文官網 News 標題）。
 * 執行：node scripts/merge-events-english.mjs
 * 請勿用 PowerShell ConvertTo-Json 寫回 JSON，易破壞 Unicode（長破折號等）。
 * 產生 immba-pure.html：npm run build:pure（無 Node 時會改跑 scripts/build-pure-html.ps1）
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const eventsPath = path.join(root, "data", "events.json");

/** 英文標題參考：https://www.management.fju.edu.tw/esubweb/immbaengindex/ News 列表 */
const PATCH = {
  "evt-20260331-italy": {
    dateZh: "2026/03/31",
    titleEn: "Italy, here we go.",
    bodyEn:
      "Co-organized by the Executive Master of Technology Management and the International MBA (imMBA), the 2026 international professional study tour departs for Italy tonight for 13 days of cross-border learning and industry exchange.\n\nFrom northern to southern Italy—Milan, Verona, Venice, Bologna, Rome, and on to Sorrento and Capri—we explore cities, industries, and culture in depth.\n\nBefore departure, Dr. Giorgia Sfriso (Italian studies) offered a session on Italy’s cultural context, cities, industry, and family business—so students could “read” the country before arriving.\n\nWe will visit century-old olive oil makers, glass artisans, leading automotive brands, and one of the world’s oldest universities, seeing management in action.\n\nA journey of management, industry, and culture is underway.",
  },
  "evt-20260327-bgs": {
    dateZh: "2026/03/27",
    titleEn: "Rethinking Impact at the BGS Summit in Barcelona",
    bodyEn:
      "When “hard skills” meet the global stage, what changes? Xu Yanxin, pursuing a dual degree at KEDGE Business School and a Beta Gamma Sigma honoree, joined the global leadership forum in Barcelona, Spain.\n\nBGS invites top students from AACSB-accredited schools; membership is by invitation—a mark of excellence.\n\nFor her, study abroad is not only coursework but a shift from “hard knowledge” to influence and communication.\n\nAmong student leaders worldwide, she saw that impact often means articulating ideas clearly under time pressure. “Leadership is not only a title—it is how you convey influence in dialogue.”\n\nThe forum renewed her view of leadership: “Great leaders pursue excellence while giving back and lifting others.” From a French classroom to a Spanish forum, the journey reshaped her outlook—and she encourages peers to seize similar opportunities.",
  },
  "evt-20260318-france": {
    dateZh: "2026/03/18",
    titleEn: "Study in France—with the same tuition",
    bodyEn:
      "imMBA has renewed academic cooperation with KEDGE Business School, extending a long partnership and dual-degree opportunities for students.\n\nKEDGE is a leading French school with campuses in Paris, Bordeaux, and Marseille. QS 2025 ranks its business and management field 51st–100th globally; it holds AACSB, EQUIS, and AMBA—Triple Crown, shared by only about 1% of business schools.\n\nUnder the dual agreement, imMBA students may study in France while paying Fu Jen tuition.\n\nNew elective modules at KEDGE are in planning and will be announced soon.",
  },
  "evt-20260311-openhouse": {
    dateZh: "2026/03/11",
    titleEn: "Did you visit Fu Jen's Open House last weekend?",
    bodyEn:
      "Last weekend’s Open House opened classrooms and labs across colleges—courses, hands-on activities, and campus tours helped visitors see how each program learns.\n\nFor many, it was a first step into university choices—and learning continues after undergraduate study.\n\nThe College of Management offers an international path: imMBA, taught entirely in English, with classmates from many countries discussing business in one room.\n\nDual-degree agreements open study in Europe and the U.S. with efficient planning.\n\nIf Open House was your introduction to Fu Jen, for some the next stop may be imMBA.",
  },
  "evt-20260304-aacsb": {
    dateZh: "2026/03/04",
    titleEn: "What Enables International Collaboration?",
    bodyEn:
      "When we expand dual-degree partnerships, a common question is whether credits transfer smoothly.\n\nA key factor is AACSB accreditation held by the College of Management.\n\nAACSB (Association to Advance Collegiate Schools of Business) is a leading global standard; only about 5–6% of business schools earn it. It is not a membership club but a rigorous, ongoing quality review of curriculum, faculty, and outcomes.\n\nimMBA, as the college’s international platform, is fully English-medium and aligned with global business education.\n\nStudents benefit: curriculum meets international standards; credit review has a shared basis; partnerships rest on comparable quality; degrees gain recognition.\n\nCollaboration grows when both sides stand on the same international benchmark.",
  },
  "evt-20260225-stirling": {
    dateZh: "2026/02/25",
    titleEn: "International Collaboration Expands | Advancing Our First UK Academic Partnership",
    bodyEn:
      "To grow imMBA’s global network, we have made substantive progress on dual-degree discussions with the University of Stirling, UK.\n\nStirling is a public research university in Scotland, highly ranked internationally, with strong business, marketing, and sustainability programs.\n\nIf details and signatures are completed, Stirling would be imMBA’s first UK partner—opening a new study-abroad option.\n\nDetails remain under confirmation; we will announce formally when ready.\n\nCaption: dual-degree meeting online. Left: Ms. Rui Brown (Stirling). Right: imMBA Director Du Yi-ning.",
  },
  "evt-20260211-perspective": {
    dateZh: "2026/02/11",
    titleEn: "Beyond Borders, Beyond Perspectives",
    bodyEn:
      "“One of the biggest gains from going abroad is seeing global markets and trends from different angles.”\n\nThat “angle” is not only textbook comparison but living inside another society—business decisions, social issues, and expectations about work differ from Taiwan.\n\nDaily differences helped her see “trends” as shared practice over time. ESG, often discussed conceptually in Taiwan, abroad can be woven into life and corporate culture.\n\nShe began to reassess Taiwan: “I used to rationalize gaps as ‘Taiwan style’; after other countries, I see more clearly where improvement is possible.”\n\nBeyond borders came deeper understanding and sharper thinking—and a wider view.",
  },
  "evt-20260204-classroom": {
    dateZh: "2026/02/04",
    titleEn: "What does it feel like to study in the imMBA program?",
    bodyEn:
      "Many students say you can hardly stay invisible.\n\n“Classes are small; faculty notice everyone—you’re not overlooked and you participate more.” That is the first thing classmates mention.\n\nAll-English instruction is demanding, but the room pulls you in. “You almost have to speak English; teachers push every student to voice ideas—and confidence builds over time.”\n\nSome courses flip the classroom—students present and teach peers. “Faculty give strong feedback and guidance so learning isn’t ‘finish the report and forget’ but truly internalized.”\n\nGrowth in expertise and English accumulates class by class—not overnight.",
  },
  "evt-20260128-supermarket": {
    dateZh: "2026/01/28",
    titleEn: "Four Hours in a Supermarket: A Student's First Taste of Life Abroad",
    bodyEn:
      "When we collect study-abroad stories, many vivid memories start with everyday challenges.\n\nIn France, shopping, transit, and small talk all had to be relearned; language and culture made familiar routines strange.\n\nOne student recalled: “First big supermarket trip—I couldn’t read labels or use checkout and stayed inside four hours.”\n\nThat was the edge of the comfort zone: trying again and again, worrying less, and looking for solutions.\n\nKindness across cultures—patient explanations, gestures, a small help—showed how warm cross-cultural contact can be. Step by step, students built confidence abroad and found their own rhythm.",
  },
  "evt-20260121-pauline": {
    dateZh: "2026/01/21",
    titleEn: "From Engineer to Manager: Seeing Farther, and Knowing the Next Step",
    bodyEn:
      "Pauline Joyce Zac from India graduated from imMBA (114-1). Her first time abroad brought her to Taiwan and Fu Jen.\n\nShe had 3.5 years as a software engineer but wanted macro thinking, not only technical depth. imMBA was not “just a degree” but a journey that reframed problems—and made the impossible feel possible.\n\nWith management training plus engineering experience, she attracted opportunities before graduation; her former employer invited her back into a managerial role.\n\nThat is the path imMBA hopes to walk with students: not only knowledge, but seeing farther and choosing the next step with clarity.",
  },
  "evt-20260113-woosong": {
    dateZh: "2026/01/13",
    titleEn: "Deepening Cross-Border Dialogue: imMBA and Woosong University",
    bodyEn:
      "Woosong University visited last week. Dean Huang Mei-chu, Associate Dean Li Li-meng, and imMBA Director Du Yi-ning met Dr. Yoo-Taek Lee to exchange views on future cooperation.\n\nNotably, Woosong’s SolBridge International School of Business is among Korea’s few English-medium international business schools; its master’s focus on international management and practice aligns with imMBA.\n\nSolBridge sits in Daejeon, a tech and research hub, with AACSB accreditation and a highly international student body.\n\nThe visit clarified how each side teaches in English and grows globally—laying groundwork for deeper partnership.",
  },
  "evt-20251224-english": {
    dateZh: "2025/12/24",
    titleEn: "Can You Go Global Without 'Perfect' English?",
    bodyEn:
      "At a recent imMBA admissions session, many asked: can I really adapt to all-English classes?\n\nAlumni from diverse backgrounds described the real classroom climate.\n\nA Polish alumnus said discussion itself is learning—cultures and viewpoints make every contribution matter.\n\nAnother shared: she entered below CEFR B2, but through courage and daily practice in an English environment, her score rose more than 100 points in a year; she reached B2 and is heading toward the dual degree.\n\nEnglish-medium study is not only a gate—it can accelerate growth.\n\nAfterward, students noted how many overseas options exist, how flexible the curriculum is, and how dual-degree tuition support makes study abroad more reachable.\n\nEven without a dual degree as a goal, English becomes a usable skill, and each cross-cultural experience builds mobility—you do not wait for “perfect” English before you move; you advance in the right environment.",
  },
  "evt-20251217-dual": {
    dateZh: "2025/12/17",
    titleEn: "A Decade of Steady Progress on the Dual-Degree Path",
    bodyEn:
      "When an alumnus wrote on Threads that exchange choices were overwhelming and employers “looked twice” at a Catholic University diploma, many saw Fu Jen’s international strength is real—not slogans.\n\nimMBA’s dual-degree track embodies that strength.\n\nFor over a decade, cohort after cohort has completed degrees abroad and returned with two master’s credentials—Fu Jen and partner schools. This is lived internationalization.\n\nIf you want more than a short trip—if you want European or U.S. classrooms and two degrees on one planned path—imMBA is a serious choice.",
  },
  "evt-20251119-cyber": {
    dateZh: "2025/11/19",
    titleEn: "Not from IT? You Can Still Enter Cybersecurity",
    bodyEn:
      "A career session surprised students in the best way.\n\nWe hosted engineer Hsieh Yun-chih, who majored in diplomacy with no IT background yet built discipline and persistence to pivot into cybersecurity and land a dream role.\n\nAfter class: “Careers really can restart if you commit.”\n\nTakeaways: your background is a starting point, not a ceiling; change has no expiry; each step can move you toward the future you want.",
  },
  "evt-20251105-kedge": {
    dateZh: "2025/11/05",
    titleEn: "imMBA × KEDGE Dual Degree: On the Ground, Another Level of Challenge",
    bodyEn:
      "“I thought my English was fine—then week one a French professor’s accent knocked me out.” That is daily life in imMBA × KEDGE: intensive weekly classes, international team projects, and beginner French—all pushing you to speak up and think flexibly.\n\nTwo degrees mean entering multicultural decision spaces and learning to argue well in more than one language.\n\nYear one in Taiwan builds core business skills in English; year two in France tests you in cross-cultural management.\n\nDual degrees, dual culture, workplace readiness—and similar paths exist in the U.S. and Spain, with more partners in discussion.\n\nimMBA: from Taiwan to a connected world.",
  },
  "evt-20251028-wtw": {
    dateZh: "2025/10/28",
    titleEn: "Talent Strategy Forward: Former WTW Leader Speaks at imMBA",
    bodyEn:
      "imMBA hosted former WTW Taiwan GM Wang Po-sung on Talent Retention—how firms attract and keep key people amid globalization and transformation.\n\nProfessor Huang Shu-fen (formerly CHB HR VP) facilitated, linking culture, incentives, and sustainable talent. International students brought diverse views and a global classroom feel.\n\nMore industry speakers will follow—bridging campus and practice.",
  },
  "evt-20251021-leeds": {
    dateZh: "2025/10/21",
    titleEn: "College of Management & imMBA Welcome the University of Leeds",
    bodyEn:
      "Top UK university University of Leeds visited to discuss academic exchange.\n\nParticipants included Associate Dean Li Li-meng, imMBA Director Du Yi-ning, and Dr. Christina Papadopoulou (Leeds international office).\n\nLeeds holds AACSB, AMBA, and EQUIS and ranks 75th in QS World University Rankings 2025—a leading business school.\n\nimMBA continues to connect Fu Jen students with world-class partners.",
  },
  "evt-20251009-welcome": {
    dateZh: "2025/10/09",
    titleEn: "From India to Poland—Welcome, New imMBA Cohort",
    bodyEn:
      "Welcome to the Fu Jen imMBA family!\n\nWe warmly welcome new classmates from India, Poland, Guatemala, and beyond.\n\nA recent gathering introduced students to faculty; Director Du Yi-ning shared academic planning and encouraged collaboration throughout the journey.\n\nIn this diverse classroom, every student brings culture and experience—that is imMBA’s greatest asset.",
  },
};

const data = JSON.parse(fs.readFileSync(eventsPath, "utf8"));
let n = 0;
for (const e of data.events) {
  const p = PATCH[e.id];
  if (p) {
    Object.assign(e, p);
    n++;
  }
}
fs.writeFileSync(eventsPath, JSON.stringify(data, null, 2) + "\n");
console.log("Merged English fields for", n, "events →", path.relative(root, eventsPath));
