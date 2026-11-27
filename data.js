// 化学変化あての問題を作る（ブラウザと node の両方で使う）。
// 中身は、大阪府教育委員会の中学2年理科「13 化学変化」補充・発展プリント・「14 化学変化と物質の質量」確認プリント（解答）と、
// 千葉県教育委員会「やる気アップ 理科」2年「物質の分解」「酸化と還元」（解答）（下の SRC。2026-11-17 に読んだ）で確かめたことだけ。
// 扱うのは「どの化学変化か」（熱分解・電気分解・酸化・還元・酸素以外との化合）と「物質が分かれるか・結びつくか」だけ。実験の手順・量は書かない。
// 1問は、化学変化の例を見て、どの化学変化かを選ぶ。正解したら2段目「分かれる？結びつく？」を選ぶ。
// 選び肢は、ほかの4つから選ぶ（やさしいは3つ、ふつう・むずかしいは4つ）。
// 乱数 R は呼ぶ回数が毎回同じになるように使う（sort の比較の中では引かない）。同じ tag なら、どの端末でも同じ問題になる。
// KINDS・言い回しの並びは最後に足すだけにする（並べ替え・削除をすると過去の日の問題が変わる）。
(function (root) {
  "use strict";
  const LV = ["やさしい", "ふつう", "むずかしい"];
  const OSAKA = (n) => "https://www.pref.osaka.lg.jp/documents/25642/rika_2nen_" + n + "_kai.pdf";
  const CHIBA = (n) => "https://www.pref.chiba.lg.jp/kyouiku/shidou/gakuryoku/yaruki/rika/documents/" + n + ".pdf";

  // 出典（画面の「なぜ」に出す）
  const SRC = {
    hoju: ["大阪府教育委員会「中学2年理科 13 化学変化」補充プリント（解答）", OSAKA("13_2hoju")],
    hatu: ["大阪府教育委員会「中学2年理科 13 化学変化」発展プリント（解答）", OSAKA("13_3hatu")],
    shitsu: ["大阪府教育委員会「中学2年理科 14 化学変化と物質の質量」確認プリント（解答）", OSAKA("14_1kaku")],
    bunkai: ["千葉県教育委員会「やる気アップ 理科」2年 物質の分解（解答つき）", CHIBA("08r02")],
    sanka: ["千葉県教育委員会「やる気アップ 理科」2年 酸化と還元（解答つき）", CHIBA("11r02")],
  };

  // 答えになる5つの化学変化
  const CLASSES = ["熱分解", "電気分解", "酸化", "還元", "酸素以外との化合"];

  // 2段目「分かれる？結びつく？」の3つ（大阪府 補充プリントの言葉の説明）
  const GROUPS = {
    wak: { name: "分かれる", sub: "1種類の物質が2種類以上に分かれる（分解）" },
    mus: { name: "結びつく", sub: "2種類以上の物質が結びつき、別の1種類ができる（化合）" },
    han: { name: "酸素がはなれる", sub: "酸化物から酸素がはなれる" },
  };
  // もう1つの見方（何が起きるか）。「なぜ」に出す
  const CATS = { ne: "加熱して分ける", de: "電流を流して分ける", up: "酸素と結びつく", dn: "酸素をうばわれる", ka: "酸素ではない物質と結びつく" };
  // 化学変化ごとの決まり。答えと2段目・見方はこの表で決まる（qa/run.mjs が別に持った表でも確かめる）
  const RULE = {
    "熱分解": { grp: "wak", cat: "ne", key: "加熱して、1種類の物質が2種類以上の物質に分かれる化学変化です（分解）。" },
    "電気分解": { grp: "wak", cat: "de", key: "電流を流して、1種類の物質が2種類以上の物質に分かれる化学変化です（分解）。" },
    "酸化": { grp: "mus", cat: "up", key: "物質が酸素と結びつく（化合する）変化です。激しく光や熱を出す酸化を燃焼といいます。" },
    "還元": { grp: "han", cat: "dn", key: "酸化物から酸素がはなれる化学変化です。このとき、酸素をうばった物質は酸化されます。" },
    "酸素以外との化合": { grp: "mus", cat: "ka", key: "2種類以上の物質が結びつき、もとの物質と性質のちがう別の1種類の物質ができる変化（化合）です。" },
  };

  // part:ri:begin（shared-workflows の template/parts/data/ri.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  const ri = (R, a, b) => a + Math.floor(R() * (b - a + 1));
  // part:ri:end
  // part:shuffle:begin（shared-workflows の template/parts/data/shuffle.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function shuffle(R, a) { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = ri(R, 0, i); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  // part:shuffle:end
  // part:pickN:begin（shared-workflows の template/parts/data/pickN.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function pickN(R, a, n) { return shuffle(R, a).slice(0, n); }
  // part:pickN:end
  const MEDIA = ["理科室で", "理科の授業で", "実験ノートで", "教科書で", "テスト勉強で"];
  // 問いの前につく言い方（どれでも答えは同じ）
  const PRE = ["実験1。", "先生の実験。", "教科書の実験。", "班の実験。", "ノートの記録。"];

  // どの化学変化かを当てる問題。ans：答え、sit：言い方。選び肢は、ほかの4つから（やさしいは2つ、ふつう・むずかしいは3つ）
  function which(ans, sit) {
    const near = CLASSES.filter((c) => c !== ans);
    return (R, lv) => {
      const si = ri(R, 0, sit.length - 1), mi = ri(R, 0, MEDIA.length - 1);
      const n = lv === 0 ? 2 : 3, ds = pickN(R, near, n);
      const q = sit[si] + "　どの化学変化？";
      return { type: "act", media: MEDIA[mi], q, opts: shuffle(R, [ans, ...ds]), ans, rev: false, v: `${si}:${mi}` };
    };
  }
  // 1つの種類（化学変化の例）を作る。grp・cat・key は決まり RULE から。clue は例の文（PRE と組む）
  function K(id, lv, ans, name, src, look, why, clue) {
    const r = RULE[ans];
    return { id, lv, grp: r.grp, cat: r.cat, ans, name, src, look, key: r.key, why, make: which(ans, clue.flatMap((c) => PRE.map((p) => p + c))) };
  }

  const KINDS = [
    // ---- やさしい ----
    K("nahco3", 0, "熱分解", "炭酸水素ナトリウムを加熱", ["hoju", "bunkai"], "加熱すると、1つの物質から3つの物質ができます。",
      "炭酸水素ナトリウムを加熱すると、炭酸ナトリウム・水・二酸化炭素に分かれます（大阪府 補充プリント・千葉県「熱分解」）。",
      ["炭酸水素ナトリウムを加熱すると、炭酸ナトリウム・水・二酸化炭素ができた。"]),
    K("ag2o", 0, "熱分解", "酸化銀を加熱", ["bunkai", "hatu"], "加熱すると、銀と気体に分かれます。",
      "酸化銀を加熱すると、銀と酸素に分かれます（千葉県「熱分解」・大阪府 発展プリント）。",
      ["黒い酸化銀を加熱すると、銀と酸素ができた。"]),
    K("h2o", 0, "電気分解", "水に電流を流す", ["bunkai"], "電流を流して、水を分けます。",
      "水に電流を流すと、陰極に水素、陽極に酸素が出ます（千葉県 物質の分解）。電流を流れやすくするため水酸化ナトリウムをとかします。",
      ["水酸化ナトリウムを少しとかした水に電流を流すと、水素と酸素ができた。"]),
    K("fes", 0, "酸素以外との化合", "鉄と硫黄を加熱", ["hoju"], "鉄と硫黄が結びつきます。酸素はかかわりません。",
      "鉄と硫黄が結びついて硫化鉄ができます（大阪府 補充プリント「鉄＋硫黄→硫化鉄（化合）」）。",
      ["鉄と硫黄を混ぜて加熱すると、硫化鉄ができた。"]),
    K("mg", 0, "酸化", "マグネシウムを燃やす", ["shitsu", "sanka"], "空気中で燃やすと、何と結びつくでしょう。",
      "マグネシウムが酸素と結びつき、酸化マグネシウムになります（大阪府 14 確認プリント）。物質が酸素と結びつくことを酸化といいます（千葉県）。",
      ["マグネシウムを空気中で加熱すると、酸化マグネシウムができた。"]),
    // ---- ふつう ----
    K("cucl2", 1, "電気分解", "塩化銅水溶液に電流を流す", ["bunkai"], "水溶液に電流を流すと、＋極と－極に別の物質が出ます。",
      "塩化銅水溶液を電気分解すると、＋極では塩素、－極では銅ができます（千葉県 物質の分解）。",
      ["塩化銅水溶液に電流を流すと、＋極に塩素、－極に銅ができた。", "塩化銅水溶液に電流を流すと、塩化銅が銅と塩素に分かれた。"]),
    K("hcl", 1, "電気分解", "うすい塩酸に電流を流す", ["bunkai"], "塩酸に電流を流したときの変化です。",
      "うすい塩酸に電流を流すと、－極に水素、＋極に塩素が出ます（千葉県 物質の分解）。",
      ["うすい塩酸に電流を流すと、－極に水素、＋極に塩素が出てきた。", "うすい塩酸に電流を流すと、2つの気体に分かれた。"]),
    K("steel", 1, "酸化", "スチールウールを燃やす", ["hoju", "sanka"], "鉄が空気中の何と結びつくでしょう。",
      "鉄（スチールウール）は酸素と結びつき、黒色の酸化鉄になります（大阪府 補充プリント）。光や熱を出す激しい酸化を燃焼といいます（千葉県）。",
      ["スチールウール（鉄）を加熱すると、赤くなって燃え、黒色の酸化鉄になった。", "スチールウールを燃やすと、鉄が空気中の酸素と結びついた。"]),
    K("cuo", 1, "還元", "酸化銅と炭素（酸化銅の変化）", ["hoju", "sanka"], "酸化銅から酸素がどうなったでしょう。",
      "酸化銅と炭素を混ぜて加熱すると、酸化銅は酸素をうばわれて銅になります。これが還元です（大阪府 補充プリント・千葉県）。",
      ["酸化銅と炭素の粉を混ぜて加熱すると、銅と二酸化炭素ができた。このとき酸化銅に起きた変化は、", "酸化銅と炭素を加熱した。酸化銅から酸素がはなれて、銅になった。"]),
    K("h2o2", 1, "酸化", "水素が酸素と結びつく", ["sanka"], "水素と酸素が結びつくと、何ができるでしょう。",
      "水素が酸素と結びつくと水ができます（千葉県 酸化と還元）。物質が酸素と結びつくことを酸化といいます。",
      ["水素が酸素と結びついて、水ができた。", "水素を燃やすと、空気中の酸素と結びついて水ができた。"]),
    // ---- むずかしい ----
    K("kairo", 2, "酸化", "化学かいろ（鉄粉）", ["hatu"], "鉄粉が空気中の何と結びつくと熱が出るでしょう。",
      "鉄粉が空気中の酸素と化合（酸化）することで熱が出ます（大阪府 発展プリント）。袋をあけないと酸素と結びつかず、熱は出ません。",
      ["化学かいろの袋をあけると、中の鉄粉が空気中の酸素と結びついて熱が出た。", "鉄粉が入ったかいろ。袋をあけないと、熱が出ない。中の鉄に起きる変化は、"]),
    K("fe2o3", 2, "還元", "酸化鉄と炭素（製鉄）", ["sanka"], "鉄をとり出すとき、酸化鉄から何がはなれるでしょう。",
      "酸化鉄と炭素から鉄と二酸化炭素ができます（千葉県 酸化と還元）。酸化鉄から酸素がはなれるので還元です。",
      ["鉄をつくるとき、酸化鉄と炭素から鉄と二酸化炭素ができる。このとき酸化鉄に起きる変化は、", "製鉄で、酸化鉄から酸素がはなれて鉄になった。"]),
    K("mgco2", 2, "還元", "二酸化炭素の中でマグネシウム（二酸化炭素の変化）", ["sanka"], "二酸化炭素から酸素をうばったのはどちらでしょう。",
      "マグネシウムが二酸化炭素の酸素をうばい、二酸化炭素は還元されて炭素が残ります（千葉県 酸化と還元）。",
      ["火のついたマグネシウムを二酸化炭素の中に入れると燃え続け、炭素が残った。このとき二酸化炭素に起きた変化は、", "マグネシウムが二酸化炭素の酸素をうばって燃えた。二酸化炭素に起きた変化は、"]),
    K("cuo_c", 2, "酸化", "酸化銅と炭素（炭素の変化）", ["sanka", "hoju"], "酸化銅から酸素をうばった炭素は、どうなったでしょう。",
      "酸化銅と炭素を加熱すると、炭素は酸化銅の酸素と結びついて二酸化炭素になります。炭素に起きたのは酸化です（千葉県 酸化と還元）。",
      ["酸化銅と炭素の粉を混ぜて加熱すると、銅と二酸化炭素ができた。このとき炭素に起きた変化は、", "酸化銅と炭素を加熱した。炭素は酸素と結びついて二酸化炭素になった。炭素に起きた変化は、"]),
    K("kago", 2, "酸素以外との化合", "2種類が結びついて別の1種類", ["hoju"], "酸素ではない物質どうしが結びつく変化です。",
      "2種類以上の物質が結びつき、性質のちがう別の1種類の物質ができる化学変化を化合といいます（大阪府 補充プリント）。鉄と硫黄から硫化鉄ができるのがその例です。",
      ["鉄と硫黄のように、2種類の物質が結びついて、性質のちがう別の1種類の物質ができた。酸素はかかわっていない。", "鉄と硫黄が結びついて、もとの鉄とも硫黄ともちがう性質の、硫化鉄ができた。"]),
  ];
  const BY = Object.fromEntries(KINDS.map((k) => [k.id, k]));
  const kindsOf = (lv) => KINDS.filter((k) => k.lv === lv).map((k) => k.id);

  // part:seedOf:begin（shared-workflows の template/parts/data/seedOf.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function seedOf(str) { let h = 2166136261; for (const ch of String(str)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  // part:seedOf:end
  // part:rng:begin（shared-workflows の template/parts/data/rng.js の写し。ここでは直さない。node scripts/sync-template.mjs で写す）
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // part:rng:end

  // 1問を作る。tag は「種類|種」（例 "nahco3|2026-11-18:d0"）。同じ tag ならいつも同じ問題
  function make(tag) {
    const [kind] = String(tag).split("|"), k = BY[kind];
    if (!k) return null;
    const p = k.make(rng(seedOf(tag)), k.lv);
    return { tag, kind, lv: k.lv, name: k.name, look: k.look, key: k.key, why: k.why, grp: k.grp, cat: k.cat, src: k.src.map((s) => SRC[s]), ...p };
  }
  const keyOf = (P) => `${P.kind}:${P.q}:${P.opts.slice().sort().join("/")}`;

  // 今日の5問（やさしい2・ふつう2・むずかしい1）。種類は重ねない
  function dailyTags(date) {
    const R = rng(seedOf("day:" + date)), e = pickN(R, kindsOf(0), 2), n = pickN(R, kindsOf(1), 2), h = pickN(R, kindsOf(2), 1);
    return [...e, ...n, ...h].map((id, i) => `${id}|${date}:d${i}`);
  }
  // 上級の3問（むずかしいだけ・今日の5問のむずかしいとは別の種類）
  function hardTags(date) {
    const dh = dailyTags(date)[4].split("|")[0], R = rng(seedOf("hard:" + date)), h = pickN(R, kindsOf(2).filter((x) => x !== dh), 3);
    return h.map((id, i) => `${id}|${date}:h${i}`);
  }

  const KGH = { KINDS, BY, GROUPS, CATS, RULE, LV, SRC, CLASSES, kindsOf, seedOf, rng, make, keyOf, dailyTags, hardTags, pickN };
  if (typeof module !== "undefined" && module.exports) module.exports = KGH; else root.KGH = KGH;
})(typeof self !== "undefined" ? self : this);
