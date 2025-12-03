

import { PromptTemplate } from './types';

export const SAMPLE_TEXT = `在這瞬息萬變的數位時代，人工智慧（AI）正以前所未有的速度改變我們的生活與工作模式。從自動駕駛汽車到能夠生成創意文本的語言模型，AI 的應用範疇日益廣泛。

然而，隨著技術的進步，我們也面臨著諸多挑戰，例如數據隱私、演算法偏見以及 AI 對就業市場的潛在影響。為了確保科技發展能造福全人類，我們需要跨領域的合作，制定完善的倫理規範與監管機制。

未來，人類與 AI 的協作將成為常態。學習如何有效地利用這些工具，培養批判性思維與創造力，將是我們在這個新時代中保持競爭力的關鍵。讓我們擁抱變革，共同探索科技與人文交織的無限可能。`;

export const TEXT_MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: '快速、高效，適合一般任務' },
  { id: 'gemini-3-pro-preview', label: 'Gemini 3 Pro', description: '強大的推理能力，適合複雜任務' },
];

export const IMAGE_MODELS = [
  { id: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image', description: '多模態模型，支援快速生成與圖片編輯 (Editing)' },
  { id: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image', description: '頂級多模態模型，提供最高品質的圖片生成與控制' },
  { id: 'imagen-3.0-generate-001', label: 'Imagen 3', description: '專用繪圖模型，光影與細節表現極佳 (僅支援文生圖)' },
  { id: 'imagen-3.0-fast-generate-001', label: 'Imagen 3 Fast', description: '低延遲繪圖模型，適合快速迭代 (僅支援文生圖)' },
];

export const VIDEO_MODELS = [
  { id: 'veo-3.1-generate-preview', label: 'Veo 3.1 (High Quality)', description: '最高品質影片生成，支援 1080p (生成時間較長)' },
  { id: 'veo-3.1-fast-generate-preview', label: 'Veo 3.1 Fast', description: '快速預覽模型，支援 720p，適合快速驗證動態效果' },
];

export const ASPECT_RATIOS = [
  { id: '1:1', label: '1:1 (正方形)' },
  { id: '16:9', label: '16:9 (橫向風景)' },
  { id: '9:16', label: '9:16 (直向肖像)' },
  { id: '4:3', label: '4:3 (標準螢幕)' },
  { id: '3:4', label: '3:4 (標準照片)' },
  { id: '21:9', label: '21:9 (電影寬螢幕)' },
];

// --- TEXT CATEGORIES & PROMPTS ---

export const TEXT_CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'refine', label: '潤飾優化' },
  { id: 'creative', label: '創意寫作' },
  { id: 'business', label: '職場商務' },
  { id: 'coding', label: '程式開發' },
  { id: 'technical', label: '邏輯分析' },
  { id: 'education', label: '學習教育' },
  { id: 'life', label: '生活應用' },
  { id: 'fun', label: '趣味娛樂' },
  { id: 'synthesis', label: '多文合成' },
];

export const TEXT_TONES = [
  { id: 'default', label: '預設語氣' },
  { id: 'formal', label: '正式專業' },
  { id: 'casual', label: '輕鬆隨意' },
  { id: 'humorous', label: '幽默風趣' },
  { id: 'poetic', label: '優美詩意' },
  { id: 'concise', label: '簡潔有力' },
  { id: 'persuasive', label: '具說服力' },
  { id: 'enthusiastic', label: '熱情洋溢' },
  { id: 'empathetic', label: '同理心' },
  { id: 'academic', label: '學術嚴謹' },
  { id: 'dramatic', label: '戲劇張力' },
  { id: 'sarcastic', label: '反諷諷刺' },
  { id: 'journalistic', label: '新聞客觀' },
];

export const TEXT_PROMPTS: PromptTemplate[] = [
  // Refine
  { id: 't1', label: '精簡摘要', prompt: '請將這段文字總結為簡短的摘要，保留核心觀點，長度控制在 50 字以內。', description: '快速抓重點。', category: 'refine' },
  { id: 't2', label: '文法修正', prompt: '請檢查這段文字的文法錯誤、錯別字與標點符號使用，並提供修正後的版本。', description: '校對助手。', category: 'refine' },
  { id: 't3', label: '語氣調整 (專業)', prompt: '將這段文字改寫為更加正式、專業的商務語氣，適合用於官方報告或郵件。', description: '提升專業度。', category: 'refine' },
  { id: 't4', label: '語氣調整 (親切)', prompt: '將這段文字改寫為親切、溫暖且易於閱讀的口吻，適合用於社群媒體貼文。', description: '拉近距離。', category: 'refine' },
  { id: 't5', label: '英文翻譯 (道地)', prompt: '將這段文字翻譯成流暢、自然的英文，避免逐字翻譯，確保符合母語人士的習慣。', description: '高品質翻譯。', category: 'refine' },
  { id: 't6', label: '擴寫內容', prompt: '請根據這段文字的主題進行擴寫，增加更多細節、例子與論述，使其更加豐富完整。', description: '豐富文章。', category: 'refine' },
  { id: 't7', label: '兒童易讀版', prompt: '請用適合 8 歲兒童閱讀的簡單詞彙和句型，重新解釋這段文字的內容。', description: '簡化概念。', category: 'refine' },
  { id: 't8', label: '條列化重點', prompt: '將這段文字轉換為清晰的 Bullet Points 條列式重點，方便快速閱讀。', description: '整理結構。', category: 'refine' },
  { id: 't9', label: '標題生成', prompt: '請為這段文字生成 5 個吸引人的標題，風格涵蓋：聳動、專業、疑問句、數據導向。', description: '下標靈感。', category: 'refine' },
  { id: 't10', label: '關鍵字提取', prompt: '請提取這段文字中的 5-10 個 SEO 關鍵字，並依照重要性排序。', description: 'SEO 優化。', category: 'refine' },
  { id: 't11', label: '段落重組', prompt: '請重新組織這段文字的段落結構，使其邏輯更通順，起承轉合更流暢。', description: '結構優化。', category: 'refine' },
  { id: 't12', label: '被動轉主動', prompt: '將文字中所有的被動語態改寫為主動語態，使語句更有力。', description: '增強語氣。', category: 'refine' },
  { id: 't13', label: '成語替換', prompt: '在適當的地方加入成語或諺語，使這段文字更具文學素養。', description: '文采修飾。', category: 'refine' },
  { id: 't14', label: '去除贅字', prompt: '請刪除文字中的贅字與冗詞，使其更加精鍊，不改變原意。', description: '精簡文字。', category: 'refine' },
  { id: 't15', label: '格式清理', prompt: '移除文字中多餘的換行、空格與特殊符號，整理成標準的段落格式。', description: '排版整理。', category: 'refine' },
  { id: 't_new_1', label: '學術引用格式', prompt: '將這段參考文獻資訊轉換為標準的 APA 第 7 版引用格式。', description: '論文輔助。', category: 'refine' },
  { id: 't_new_2', label: '去識別化', prompt: '請將這段文字中的人名、地址、電話、Email 等個人隱私資訊 (PII) 替換為 [已遮蔽]。', description: '隱私保護。', category: 'refine' },
  { id: 't_new_3', label: '繁簡轉換 (台灣)', prompt: '將這段文字轉換為台灣習慣用語的繁體中文（例如：視頻->影片，質量->品質）。', description: '用語在地化。', category: 'refine' },

  // Creative
  { id: 'c1', label: '詩詞創作', prompt: '請根據這段文字的情境與意象，創作一首現代詩（或依需求改為七言絕句）。', description: '文字變詩歌。', category: 'creative' },
  { id: 'c2', label: '劇本改寫', prompt: '將這段文字改寫成一段電影劇本對話，包含場景描述、角色動作與對白。', description: '敘事轉對話。', category: 'creative' },
  { id: 'c3', label: '武俠風格', prompt: '請用金庸古龍式的武俠小說筆觸，重新描寫這段文字的情境。', description: '江湖味。', category: 'creative' },
  { id: 'c4', label: '模擬對話', prompt: '模擬兩位持相反觀點的專家，針對這段文字的主題進行一場激烈的辯論。', description: '觀點碰撞。', category: 'creative' },
  { id: 'c5', label: '廣告文案', prompt: '請為這段內容撰寫一句震撼人心的品牌 Slogan，以及一段感性的廣告旁白。', description: '品牌行銷。', category: 'creative' },
  { id: 'c6', label: '微小說', prompt: '以此文字為靈感，創作一篇 140 字以內的極短篇小說，結局要有反轉。', description: '短篇故事。', category: 'creative' },
  { id: 'c7', label: '歌詞創作', prompt: '將這段故事改寫成一首流行歌曲的歌詞，包含主歌 (Verse) 與副歌 (Chorus)。', description: '音樂靈感。', category: 'creative' },
  { id: 'c8', label: '反派獨白', prompt: '以一個迷人反派角色的口吻來敘述這段內容，帶有傲慢與哲理。', description: '角色扮演。', category: 'creative' },
  { id: 'c9', label: '意識流', prompt: '用意識流的寫作手法改寫這段經歷，強調內心流動與感官碎片。', description: '文學技巧。', category: 'creative' },
  { id: 'c10', label: '童話改編', prompt: '將這個事件改編成一個黑暗童話故事，隱含寓意。', description: '故事重述。', category: 'creative' },
  { id: 'c11', label: '脫口秀段子', prompt: '將這段嚴肅的內容改寫成一段幽默的脫口秀 (Stand-up comedy) 段子。', description: '幽默轉化。', category: 'creative' },
  { id: 'c12', label: '日記體', prompt: '以第一人稱日記的形式記錄這件事，包含當下的心情與私密想法。', description: '個人視角。', category: 'creative' },
  { id: 'c13', label: '角色扮演', prompt: '假設你是一位歷史學家，請用你的專業視角重新詮釋這段文字。', description: '視角切換。', category: 'creative' },
  { id: 'c14', label: '辯論腳本', prompt: '請分別撰寫正方與反方的開場申論，針對這段文字所提出的議題。', description: '邏輯思辨。', category: 'creative' },
  { id: 'c15', label: '電影獨白', prompt: '這是一段電影高潮處的主角內心獨白，請賦予它強烈的情感張力。', description: '情感表達。', category: 'creative' },
  { id: 'c_new_1', label: '賽博龐克風', prompt: '用賽博龐克 (Cyberpunk) 的風格改寫這段文字，加入高科技低生活、霓虹、駭客等元素。', description: '科幻風格。', category: 'creative' },
  { id: 'c_new_2', label: '恐怖小說', prompt: '將這段普通的描述改寫成令人毛骨悚然的恐怖小說片段，強調氛圍與未知的恐懼。', description: '驚悚風格。', category: 'creative' },
  { id: 'c_new_3', label: '情書生成', prompt: '根據這些關鍵字，寫一封深情、動人但不肉麻的情書。', description: '情感表達。', category: 'creative' },
  { id: 'c_new_4', label: '饒舌歌詞', prompt: '將這段內容改編成一段押韻的饒舌 (Rap) 歌詞，要有 Flow 和態度。', description: '嘻哈風格。', category: 'creative' },
  { id: 'c_new_5', label: '文言文', prompt: '將這段白話文改寫為典雅的文言文。', description: '古文風格。', category: 'creative' },

  // Business
  { id: 'b1', label: '冷郵件 (Cold Email)', prompt: '根據這段產品描述，撰寫一封吸引人的開發信 (Cold Email)，目的是邀約潛在客戶進行通話。', description: '業務開發。', category: 'business' },
  { id: 'b2', label: 'OKR 設定', prompt: '根據這段專案目標描述，協助制定一組標準的 OKR (Objectives and Key Results)。', description: '目標管理。', category: 'business' },
  { id: 'b3', label: 'SWOT 分析', prompt: '根據這段公司或產品的描述，進行詳細的 SWOT 分析（優勢、劣勢、機會、威脅）。', description: '策略分析。', category: 'business' },
  { id: 'b4', label: '會議紀錄', prompt: '將這段逐字稿整理成結構化的會議紀錄，包含決議事項 (Action Items) 與負責人。', description: '行政效率。', category: 'business' },
  { id: 'b5', label: '新聞稿', prompt: '為這個產品發佈撰寫一份正式的新聞稿，包含標題、導言與聯絡資訊。', description: '公關宣傳。', category: 'business' },
  { id: 'b6', label: '績效回饋', prompt: '根據這些工作表現紀錄，撰寫一份具建設性的績效評估回饋，採用「三明治溝通法」。', description: '管理技巧。', category: 'business' },
  { id: 'b7', label: '電梯簡報', prompt: '將這個商業構想濃縮成 30 秒的電梯簡報 (Elevator Pitch)，強調痛點與解決方案。', description: '簡報技巧。', category: 'business' },
  { id: 'b8', label: '職位描述 (JD)', prompt: '根據這段工作需求，撰寫一份專業的職位描述 (Job Description)，包含職責與資格。', description: '人資招聘。', category: 'business' },
  { id: 'b9', label: '面試問題', prompt: '針對這個職位，列出 5 個深度面試問題，用以評估候選人的軟實力與專業能力。', description: '面試準備。', category: 'business' },
  { id: 'b10', label: '危機處理聲明', prompt: '針對這個客訴或負面事件，草擬一份誠懇且專業的官方回應聲明。', description: '公關危機。', category: 'business' },
  { id: 'b11', label: '產品問答集', prompt: '根據產品規格，生成 5 組常見問答 (FAQ)，涵蓋功能、價格與保固。', description: '客戶服務。', category: 'business' },
  { id: 'b12', label: '使用場景描述', prompt: '描述此產品的三個具體使用場景，強調它如何解決用戶的實際問題。', description: '行銷素材。', category: 'business' },
  { id: 'b13', label: '商業計畫摘要', prompt: '將這段凌亂的想法整理成一份商業計畫書的執行摘要 (Executive Summary)。', description: '創業募資。', category: 'business' },
  { id: 'b14', label: '競爭者分析', prompt: '比較這段文字中提到的產品與市場上主要競爭對手的優劣勢。', description: '市場研究。', category: 'business' },
  { id: 'b15', label: '電子報 (Newsletter)', prompt: '將這篇長文改寫成一期電子報，包含引言、重點摘要與行動呼籲 (CTA)。', description: '內容行銷。', category: 'business' },
  { id: 'b_new_1', label: '拒絕信', prompt: '撰寫一封禮貌且專業的拒絕信（針對求職者或合作提案），保持未來合作的可能性。', description: '婉拒溝通。', category: 'business' },
  { id: 'b_new_2', label: '加薪談判', prompt: '協助撰寫一份請求加薪或升遷的提案，列舉具體貢獻與市場行情數據。', description: '薪資談判。', category: 'business' },
  { id: 'b_new_3', label: '道歉信', prompt: '針對這個失誤（如出貨延遲、資料錯誤），撰寫一封真誠的客戶道歉信，並提出補償方案。', description: '客戶維繫。', category: 'business' },
  { id: 'b_new_4', label: '活動企劃案', prompt: '根據這個主題，生成一份活動企劃大綱，包含流程、預算估算與預期效益。', description: '活動策劃。', category: 'business' },
  { id: 'b_new_5', label: '品牌故事', prompt: '根據創辦人的經歷與願景，撰寫一個感人且具啟發性的品牌故事。', description: '品牌建立。', category: 'business' },
  { id: 'b_new_6', label: '使用者見證', prompt: '根據產品特點，模擬撰寫 3 則不同客群的正面使用者見證 (Testimonials)。', description: '社會證明。', category: 'business' },

  // Coding
  { id: 'code1', label: '解釋程式碼', prompt: '請解釋這段程式碼的功能、運作原理以及各變數的用途。', description: '代碼理解。', category: 'coding' },
  { id: 'code2', label: '重構優化', prompt: '請重構這段程式碼，提高其可讀性與效能，並遵循 Clean Code 原則。', description: '代碼品質。', category: 'coding' },
  { id: 'code3', label: '撰寫註解', prompt: '為這段程式碼加上詳細的 JSDoc 或 Python Docstring 註解。', description: '文件化。', category: 'coding' },
  { id: 'code4', label: '單元測試', prompt: '請為這段函式撰寫涵蓋各種邊界情況 (Edge Cases) 的單元測試 (Unit Test)。', description: '測試覆蓋。', category: 'coding' },
  { id: 'code5', label: '錯誤偵測', prompt: '找出這段程式碼中潛在的 Bug、安全漏洞或邏輯錯誤，並提供修復建議。', description: 'Debug。', category: 'coding' },
  { id: 'code6', label: '語言轉換', prompt: '將這段 Python 程式碼轉換為等效的 TypeScript 程式碼，並保持功能一致。', description: '語言遷移。', category: 'coding' },
  { id: 'code7', label: '正則表達式', prompt: '請解釋這個 Regex 的含義，或者根據需求撰寫一個 Regex。', description: 'Regex。', category: 'coding' },
  { id: 'code8', label: 'SQL 查詢優化', prompt: '分析這個 SQL 查詢語句，並建議如何建立索引或重寫以提升查詢速度。', description: '資料庫。', category: 'coding' },
  { id: 'code9', label: '複雜度分析', prompt: '分析這段演算法的時間複雜度 (Big O) 與空間複雜度。', description: '演算法。', category: 'coding' },
  { id: 'code10', label: 'API 文件生成', prompt: '根據這段後端程式碼，生成一份 OpenAPI (Swagger) 格式的 API 規格文件。', description: 'API Spec。', category: 'coding' },
  { id: 'code11', label: '偽代碼轉換', prompt: '將這段程式邏輯轉換為易於理解的偽代碼 (Pseudo-code)。', description: '邏輯抽象。', category: 'coding' },
  { id: 'code12', label: 'React Hook 封裝', prompt: '將這段重複的邏輯封裝成一個 Custom React Hook。', description: '前端優化。', category: 'coding' },
  { id: 'code_new_1', label: 'Dockerfile 生成', prompt: '為這個 Node.js/Python 專案生成一個優化的 Dockerfile，包含多階段建置 (Multi-stage build)。', description: '容器化。', category: 'coding' },
  { id: 'code_new_2', label: 'GitHub Commit', prompt: '根據這段程式碼變更，生成 3 個符合 Conventional Commits 規範的 Commit Message。', description: '版控規範。', category: 'coding' },
  { id: 'code_new_3', label: 'Tailwind 轉換', prompt: '將這段 CSS 樣式轉換為 Tailwind CSS 的 class 寫法。', description: 'CSS 框架。', category: 'coding' },
  { id: 'code_new_4', label: 'SQL Schema 設計', prompt: '根據這個業務需求，設計一個關聯式資料庫的 Schema (ERD 描述)，包含 Primary/Foreign Keys。', description: '資料庫設計。', category: 'coding' },
  { id: 'code_new_5', label: 'AWS Lambda 函式', prompt: '撰寫一個 AWS Lambda 函式 (Python/Node)，用於處理 S3 上傳事件並生成縮圖。', description: '雲端運算。', category: 'coding' },
  { id: 'code_new_6', label: '資安檢測', prompt: '檢查這段程式碼是否存在 SQL Injection 或 XSS 攻擊的漏洞。', description: '安全審計。', category: 'coding' },

  // Technical & Logic
  { id: 'tech1', label: 'Mermaid 流程圖', prompt: '將這段流程描述轉換為 Mermaid.js 的 Flowchart 語法代碼。', description: '視覺化。', category: 'technical' },
  { id: 'tech2', label: 'SOP 製作', prompt: '將這段操作步驟整理成一份標準作業程序 (SOP) 文件，包含檢查點。', description: '流程標準化。', category: 'technical' },
  { id: 'tech3', label: '邏輯謬誤偵測', prompt: '分析這段論述，指出其中是否存在邏輯謬誤（如稻草人謬誤、滑坡謬誤等）。', description: '批判思考。', category: 'technical' },
  { id: 'tech4', label: '根本原因分析', prompt: '針對這個問題描述，使用「五個為什麼 (5 Whys)」法進行根本原因分析。', description: '問題解決。', category: 'technical' },
  { id: 'tech5', label: '第一原理思考', prompt: '試著用第一原理 (First Principles) 拆解這個複雜問題，回歸最基本的真理。', description: '思維模型。', category: 'technical' },
  { id: 'tech6', label: '六頂思考帽', prompt: '請分別戴上六頂思考帽（白紅黑黃綠藍），對這個議題進行多角度分析。', description: '水平思考。', category: 'technical' },
  { id: 'tech7', label: '費米估算', prompt: '請展示如何透過費米估算 (Fermi Problem) 來推估這個問題的數量級。', description: '估算技巧。', category: 'technical' },
  { id: 'tech8', label: '類比思考', prompt: '請用一個簡單的生活類比來解釋這個複雜的技術概念。', description: '概念簡化。', category: 'technical' },
  { id: 'tech9', label: '系統思考', prompt: '分析這個現象背後的系統結構、增強迴路與調節迴路。', description: '系統動力學。', category: 'technical' },
  { id: 'tech10', label: '情境規劃', prompt: '針對這個決策，規劃最好、最壞與最可能發生的三種未來情境。', description: '風險評估。', category: 'technical' },
  { id: 'tech11', label: '數據解讀', prompt: '分析這組數據描述，提出三個具洞察力的結論 (Insights)。', description: '數據分析。', category: 'technical' },
  { id: 'tech_new_1', label: '心智圖大綱', prompt: '將這個主題拆解為心智圖 (Mind Map) 的樹狀結構大綱。', description: '結構發想。', category: 'technical' },
  { id: 'tech_new_2', label: '優缺點列表 (Pros/Cons)', prompt: '針對這個選項，列出詳細的優缺點對照表，並給出最終建議。', description: '決策輔助。', category: 'technical' },
  { id: 'tech_new_3', label: '悖論分析', prompt: '解釋這個情境中存在的悖論 (Paradox)，並探討可能的解決路徑。', description: '哲學思考。', category: 'technical' },
  { id: 'tech_new_4', label: '架構圖描述', prompt: '描述一個可行的系統架構（如微服務、Serverless），以解決這個技術問題。', description: '系統設計。', category: 'technical' },
  
  // Education & Life (New Category: Life)
  { id: 'edu1', label: '蘇格拉底教學', prompt: '不要直接給答案，而是扮演蘇格拉底，透過提問引導我思考這個問題。', description: '引導式學習。', category: 'education' },
  { id: 'edu2', label: '考題生成', prompt: '根據這段教材內容，出 3 題單選題和 1 題簡答題，並附上詳解。', description: '教學輔助。', category: 'education' },
  { id: 'edu3', label: '單字記憶法', prompt: '請提供與這個主題相關的 10 個英文單字，並附上諧音記憶法或字根字首解析。', description: '語言學習。', category: 'education' },
  { id: 'edu_new_1', label: '學習計畫', prompt: '為我想學習的這個技能（如 Python、鋼琴），制定一份為期 4 週的詳細學習計畫。', description: '自學規劃。', category: 'education' },
  { id: 'edu_new_2', label: '概念解釋 (費曼)', prompt: '請使用「費曼技巧」，用最簡單的語言解釋這個複雜的概念，確保初學者能聽懂。', description: '觀念釐清。', category: 'education' },
  
  { id: 'life_1', label: '旅遊行程', prompt: '根據這個目的地與天數，規劃一份詳細的旅遊行程，包含景點、美食與交通建議。', description: '旅遊規劃。', category: 'life' },
  { id: 'life_2', label: '食譜生成', prompt: '根據冰箱裡剩下的這些食材，推薦 3 道可以做的料理食譜。', description: '烹飪靈感。', category: 'life' },
  { id: 'life_3', label: '健身課表', prompt: '為我設計一份一週的健身課表，目標是增肌/減脂，針對全身肌群。', description: '運動規劃。', category: 'life' },
  { id: 'life_4', label: '送禮建議', prompt: '對象是 [描述特徵]，預算 [金額]，請推薦 5 個合適的生日/節日禮物。', description: '送禮指南。', category: 'life' },
  { id: 'life_5', label: '心理諮商 (模擬)', prompt: '我現在感到 [情緒]，請扮演一位同理心的心理諮商師，給我一些安慰與調適建議。', description: '情緒支持。', category: 'life' },
  
  // Fun
  { id: 'fun1', label: 'Emoji 翻譯', prompt: '將這段文字翻譯成僅由 Emoji 組成的訊息，讓它變得有趣又難猜。', description: '趣味密碼。', category: 'fun' },
  { id: 'fun2', label: 'Z 世代用語', prompt: '將這段老派的文字改寫成 Z 世代 (Gen Z) 的流行用語，充滿網路梗。', description: '迷因化。', category: 'fun' },
  { id: 'fun3', label: '星座運勢', prompt: '請用星座運勢的口吻，根據這段描述給出今日的幸運建議。', description: '玄學風格。', category: 'fun' },
  { id: 'fun_new_1', label: '塔羅占卜', prompt: '請隨機抽取三張塔羅牌（過去、現在、未來），並針對我的問題進行解讀。', description: '趣味占卜。', category: 'fun' },
  { id: 'fun_new_2', label: '貓語翻譯', prompt: '將這段話翻譯成貓咪傲嬌的語氣。', description: '角色扮演。', category: 'fun' },
  { id: 'fun_new_3', label: '命名產生器', prompt: '為我的 [寵物/產品/遊戲角色] 生成 10 個酷炫、獨特的名字。', description: '命名靈感。', category: 'fun' },

  // Synthesis (Multi-text)
  { id: 'syn1', label: '比較差異', prompt: '請詳細比較提供的這幾段文字，列出它們在觀點、語氣和內容上的主要差異。', description: '對比分析。', category: 'synthesis' },
  { id: 'syn2', label: '觀點整合', prompt: '請將這幾段文字的觀點整合成一篇連貫的文章，消除矛盾並保留各方重點。', description: '內容融合。', category: 'synthesis' },
  { id: 'syn3', label: '矛盾偵測', prompt: '請檢查這幾段文字之間是否存在邏輯矛盾或事實衝突，並具體指出來。', description: '邏輯檢查。', category: 'synthesis' },
  { id: 'syn4', label: '風格融合', prompt: '請以第一段文字的風格重寫第二段文字的內容。', description: '風格遷移。', category: 'synthesis' },
  { id: 'syn5', label: '摘要合併', prompt: '請閱讀所有提供的文本，並生成一份包含所有關鍵資訊的綜合摘要。', description: '綜合報告。', category: 'synthesis' },
];

// --- IMAGE PROMPTS (Editing) ---

export const IMAGE_CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'editing', label: '修圖改圖' },
  { id: 'filter', label: '濾鏡特效' },
  { id: 'infographic', label: '設計與圖表' },
  { id: 'technical', label: '分析識別' }, 
  { id: 'creative', label: '創意風格' },
];

export const IMAGE_PROMPTS: PromptTemplate[] = [
  // Editing (修圖)
  { id: 'i1', label: '移除背景', prompt: '將這張圖片的背景完全移除，變為透明背景，保留主體的邊緣細節。', description: '去背功能。', category: 'editing' },
  { id: 'i2', label: '更換天空', prompt: '將圖片中的天空替換為湛藍的晴空，帶有幾朵白雲，光線要自然融合。', description: '風景修圖。', category: 'editing' },
  { id: 'i16', label: '細節重繪', prompt: '重新繪製圖片的特定區域，例如：移除照片中的雜物、為人物的表情做細微調整、或是改變背景的元素。', description: '局部細緻修改。', category: 'editing' },
  { id: 'i98', label: '風格穿搭', prompt: '識別人物當前的服裝風格，並將其替換為 [指定風格，如：Y2K、老錢風] 的穿搭。保留人物姿態，更換衣物與配件。', description: '風格換裝。', category: 'editing' },
  { id: 'i4', label: '添加元素', prompt: '在圖片的適當位置添加一個新元素，例如：為人物加上眼鏡、在風景中加入一隻鳥。', description: '讓AI融入新物件。', category: 'editing' },
  { id: 'i5', label: '銳化細節', prompt: '銳化這張圖片的細節，使其更加清晰，特別是紋理和邊緣。', description: '提升圖片的清晰度。', category: 'editing' },
  { id: 'i_edit_1', label: '局部重繪', prompt: '重新繪製圖片的特定區域，例如：移除照片中的雜物、為人物的表情做細微調整、或是改變背景的元素。', description: '局部細緻修改。', category: 'editing' }, 
  { id: 'i_edit_2', label: '人像光澤', prompt: '為圖片中的人像添加健康的光澤感，使皮膚看起來更光滑，眼神更有神，整體呈現高級美顏效果。', description: '為人像添加美顏效果。', category: 'editing' },
  { id: 'i_edit_3', label: '移軸攝影', prompt: '將這張風景照模擬成移軸攝影 (Tilt-shift) 效果，讓場景看起來像微縮模型玩具。', description: '微縮模型感。', category: 'editing' },
  { id: 'i_edit_4', label: '暗角效果', prompt: '為圖片四周添加柔和的暗角 (Vignette)，引導視覺焦點集中在畫面中央。', description: '氛圍暗角。', category: 'editing' },
  { id: 'i_edit_5', label: '去霧清晰', prompt: '去除圖片中的霧氣與朦朧感，提高對比度與清晰度，還原景物原色。', description: 'Dehaze。', category: 'editing' },
  { id: 'i_edit_6', label: '色彩校正', prompt: '校正圖片的白平衡，去除色偏，使膚色與環境色看起來自然準確。', description: '白平衡。', category: 'editing' },
  { id: 'i_edit_7', label: ' HDR 效果', prompt: '增強圖片的動態範圍，提亮陰影並保留高光細節，呈現 HDR 攝影風格。', description: '高動態範圍。', category: 'editing' },
  { id: 'i_edit_8', label: '降噪處理', prompt: '減少圖片中的 ISO 雜訊與顆粒感，使畫面更加純淨平滑。', description: '畫質修復。', category: 'editing' },
  { id: 'i_edit_9', label: '增加景深', prompt: '模擬大光圈鏡頭效果，模糊背景，使前景主體更加突出 (Bokeh)。', description: '背景虛化。', category: 'editing' },
  { id: 'i_edit_10', label: '老照片修復', prompt: '修復這張老照片，去除刮痕與摺痕，並適度上色還原當年風貌。', description: '照片修復。', category: 'editing' },
  { id: 'i_new_e1', label: '去除路人', prompt: '識別並移除背景中的遊客和路人，並自動修補背景，使畫面更乾淨。', description: '旅遊照救星。', category: 'editing' },
  { id: 'i_new_e2', label: '牙齒美白', prompt: '為圖片中的人物進行牙齒美白，保持自然光澤，不顯得過度修飾。', description: '人像美容。', category: 'editing' },
  { id: 'i_new_e3', label: '更換髮色', prompt: '將人物的頭髮顏色更換為 [指定顏色]，保留髮絲細節與光澤感。', description: '造型嘗試。', category: 'editing' },
  { id: 'i_new_e4', label: '紅眼消除', prompt: '檢測並修復人物眼中的紅眼現象，恢復自然的瞳孔顏色。', description: '照片修復。', category: 'editing' },
  { id: 'i_new_e5', label: '增加笑容', prompt: '微調人物的嘴角，使其露出自然、親切的微笑。', description: '表情調整。', category: 'editing' },
  { id: 'i_new_e6', label: '眼鏡反光去除', prompt: '去除眼鏡鏡片上的反光或眩光，讓眼睛清晰可見。', description: '細節修復。', category: 'editing' },
  { id: 'i_new_e7', label: '建築拉直', prompt: '校正建築物的透視變形，使垂直線條保持垂直，模擬移軸鏡頭效果。', description: '建築攝影。', category: 'editing' },
  { id: 'i_new_e8', label: '季節轉換(雪景)', prompt: '將場景轉換為冬季雪景，覆蓋白雪，樹木掛霜，營造寒冷氛圍。', description: '場景變換。', category: 'editing' },
  { id: 'i_new_e9', label: '季節轉換(秋季)', prompt: '將場景中的植物與樹葉轉為金黃色與橘紅色，呈現秋天氛圍。', description: '場景變換。', category: 'editing' },
  { id: 'i_new_e10', label: '產品去背合成', prompt: '將產品主體去背，並合成到一個簡約的高級攝影棚背景中，帶有柔和投影。', description: '電商修圖。', category: 'editing' },

  // Filters (濾鏡)
  { id: 'i_tone_1', label: '調整色調', prompt: '調整這張圖片的整體色調，使其呈現更溫暖或更冷冽的感覺。', description: '改變圖片氛圍。', category: 'filter' },
  { id: 'i_film_1', label: '電影濾鏡', prompt: '將這張圖片模擬成經典電影的色彩風格，例如：東京物語或黑色電影。', description: '模仿電影視覺風格。', category: 'filter' },
  { id: 'i_retro_1', label: '復古插畫', prompt: '將這張圖片轉換成復古風格的插畫，類似於舊雜誌或書籍中的插圖。', description: '模仿舊時代插畫風格。', category: 'filter' },
  { id: 'i_cartoon_1', label: '卡通化', prompt: '將這張圖片轉換成卡通動畫風格，色彩鮮豔，線條簡潔。', description: '藝術濾鏡效果。', category: 'filter' },
  { id: 'i17', label: '電影質感', prompt: '為這張圖片添加電影感的濾鏡，調整色彩飽和度和對比度，使其看起來像電影劇照。', description: '電影視覺風格', category: 'filter' },
  { id: 'i_art_1', label: '浮世繪', prompt: '將這張圖片轉換為日本浮世繪風格，使用木刻版畫的線條與傳統配色。', description: '葛飾北齋風。', category: 'filter' },
  { id: 'i_art_2', label: '普普藝術', prompt: '使用安迪沃荷 (Andy Warhol) 的普普藝術風格重繪此圖，使用高飽和度與重複色塊。', description: '波普風。', category: 'filter' },
  { id: 'i_art_3', label: '剪紙藝術', prompt: '將圖片內容轉化為層次分明的剪紙藝術風格，呈現光影與紙張質感。', description: '工藝質感。', category: 'filter' },
  { id: 'i_art_4', label: '印象派', prompt: '模仿莫內印象派畫風，使用短促的筆觸與光影變化來重繪此圖。', description: '油畫質感。', category: 'filter' },
  { id: 'i_art_5', label: '立體主義', prompt: '以畢卡索立體主義風格重構圖片，使用幾何碎片與多視角拼貼。', description: '抽象幾何。', category: 'filter' },
  { id: 'i_art_6', label: '水墨畫', prompt: '將圖片轉換為中國傳統水墨畫風格，強調留白與墨色濃淡變化。', description: '東方美學。', category: 'filter' },
  { id: 'i_art_7', label: '像素藝術', prompt: '將圖片轉換為 8-bit 或 16-bit 的像素藝術風格，類似懷舊電玩畫面。', description: 'Pixel Art。', category: 'filter' },
  { id: 'i_art_8', label: '賽博龐克', prompt: '為圖片添加賽博龐克濾鏡，使用霓虹藍紫配色、故障藝術 (Glitch) 與科技介面元素。', description: '未來科技感。', category: 'filter' },
  { id: 'i_art_9', label: '新藝術運動', prompt: '使用慕夏 (Mucha) 的新藝術風格，加入流動的曲線、花卉裝飾與優雅的輪廓線。', description: 'Art Nouveau。', category: 'filter' },
  { id: 'i_art_10', label: '蒸汽龐克', prompt: '將圖片風格轉為蒸汽龐克，加入黃銅齒輪、維多利亞時代服飾與蒸汽機械元素。', description: '復古科幻。', category: 'filter' },
  { id: 'i_art_11', label: '馬賽克拼貼', prompt: '將圖片轉化為由彩色小磁磚拼貼而成的馬賽克藝術風格。', description: '裝飾藝術。', category: 'filter' },
  { id: 'i_art_12', label: '彩色玻璃', prompt: '模擬教堂彩色玻璃窗的效果，使用粗黑線條分隔鮮豔的色塊。', description: '光影藝術。', category: 'filter' },
  { id: 'i_new_f1', label: '故障藝術', prompt: '應用 Glitch Art 效果，模擬數位訊號損壞、RGB 分離與畫面撕裂感。', description: '數位崩壞。', category: 'filter' },
  { id: 'i_new_f2', label: '拍立得風格', prompt: '模擬拍立得 (Polaroid) 照片質感，稍微過曝的閃光燈效果與特定色偏。', description: '復古隨拍。', category: 'filter' },
  { id: 'i_new_f3', label: '藍曬圖', prompt: '將圖片轉換為藍曬圖 (Cyanotype) 風格，呈現單色的普魯士藍色調。', description: '古典顯影。', category: 'filter' },
  { id: 'i_new_f4', label: '素描手繪', prompt: '將圖片轉化為鉛筆素描風格，強調線條與陰影的筆觸。', description: '手繪質感。', category: 'filter' },
  { id: 'i_new_f5', label: '粉筆畫', prompt: '模擬黑板上的粉筆畫效果，黑色背景與白色粉筆線條。', description: '教學風格。', category: 'filter' },
  { id: 'i_new_f6', label: '低多邊形', prompt: '將圖片轉換為低多邊形 (Low Poly) 風格，由幾何三角形組成。', description: '3D 幾何。', category: 'filter' },
  { id: 'i_new_f7', label: '熱感應成像', prompt: '模擬熱感應攝影機的效果，使用紅外線熱譜圖的偽彩色。', description: '科技視覺。', category: 'filter' },
  { id: 'i_new_f8', label: 'ASCII 藝術', prompt: '將圖片轉換為由字符組成的 ASCII Art 風格。', description: '代碼藝術。', category: 'filter' },
  { id: 'i_new_f9', label: '野獸派', prompt: '使用馬諦斯野獸派風格，使用強烈、不自然的色彩與狂野的筆觸。', description: '色彩衝擊。', category: 'filter' },
  { id: 'i_new_f10', label: '版畫風格', prompt: '模擬粗獷的黑白木刻版畫效果，強調對比與刀痕質感。', description: '版畫藝術。', category: 'filter' },
  
  // Design & Infographic (設計與圖表)
  { id: 'i_struct_1', label: '爆炸圖', prompt: '將圖片中的物品繪製成工程爆炸圖 (Exploded View)，展示其內部零件與組裝順序。', description: '工程結構分析。', category: 'infographic' },
  { id: 'i_struct_2', label: '結構藍圖', prompt: '將此物品轉換為藍底白線的工程藍圖 (Blueprint)，標示尺寸與結構線條。', description: '工程製圖風。', category: 'infographic' },
  { id: 'i_struct_3', label: '透視圖', prompt: '繪製此場景的兩點透視圖，保留建築線條與空間深度感。', description: '建築透視。', category: 'infographic' },
  { id: 'i_struct_4', label: '3D 線框', prompt: '將圖片中的物體轉換為 3D Wireframe 線框模式，展現其幾何拓撲結構。', description: '3D 模型預覽。', category: 'infographic' },
  { id: 'i_struct_5', label: '部件標註', prompt: '識別圖片中的主要部件，並拉出引線進行標註 (Callouts)，形成說明書風格。', description: '使用說明圖。', category: 'infographic' },
  { id: 'i_info_1', label: '資訊圖表化', prompt: '根據這張包含數據或文字的圖片，重新設計成一張現代化、易讀的資訊圖表 (Infographic)。', description: '視覺化數據。', category: 'infographic' },
  { id: 'i_info_2', label: '視覺摘要', prompt: '將文件圖片中的重點內容提取出來，並轉化為一張帶有圖示與簡潔文字的視覺摘要圖。', description: '懶人包製作。', category: 'infographic' },
  { id: 'i_new_d1', label: 'UI 線框圖', prompt: '將這張網頁或 App 的截圖轉換為低保真線框圖 (Wireframe)，去除顏色與細節，僅保留佈局。', description: 'UI 設計。', category: 'infographic' },
  { id: 'i_new_d2', label: '平面配置圖', prompt: '根據這張室內照片，繪製一張俯視的平面配置圖 (Floor Plan)。', description: '室內設計。', category: 'infographic' },
  { id: 'i_new_d3', label: '向量插圖化', prompt: '將圖片轉換為扁平化 (Flat Design) 的向量插圖風格，色塊清晰。', description: '插圖設計。', category: 'infographic' },
  { id: 'i_new_d4', label: '手繪草圖', prompt: '將這個產品照片轉換為工業設計的手繪草圖 (Sketch)，帶有輔助線。', description: '設計提案。', category: 'infographic' },
  { id: 'i_new_d5', label: '等距視角', prompt: '將場景轉換為 2.5D 等距視角 (Isometric) 圖示風格。', description: '遊戲視角。', category: 'infographic' },

  // Technical (Image Edit Analysis - OOTD etc)
  { id: 'i_ootd', label: 'OOTD 分析', prompt: '分析圖片中人物的穿搭風格 (OOTD)。列出各單品（上衣、褲子、鞋子、配件）的特色，並評價其配色與時尚感。', description: '穿搭解析。', category: 'technical' },
  { id: 'i_char_1', label: '表情細節分析', prompt: '分析圖片中人物的微表情，解讀其眉毛、眼睛、嘴角的細微變化，推測其當下情緒（如：強顏歡笑、驚喜、輕蔑）。', description: '心理分析。', category: 'technical' },
  { id: 'i_char_2', label: '服裝風格識別', prompt: '識別人物的服裝風格（如：波西米亞、極簡主義、街頭潮流），並提供適合的場合與搭配建議。', description: '時尚顧問。', category: 'technical' },
  { id: 'i_char_3', label: '生成頭像', prompt: '基於這張人像照片，生成一個風格化的社群媒體頭像，保留特徵但更具設計感。', description: '個人品牌。', category: 'technical' },
  { id: 'i_char_4', label: '姿態與動作捕捉', prompt: '分析人物的肢體語言與姿態，描述其重心、動態線與可能意圖（如：防衛性姿勢、開放性姿勢）。', description: '動作分析。', category: 'technical' },
  { id: 'i_char_5', label: '藝術肖像', prompt: '以這張照片為基礎，繪製一幅文藝復興風格的油畫肖像，強調光影與莊重感。', description: '古典畫風。', category: 'technical' },
  { id: 'i_new_t1', label: '色彩提取', prompt: '提取這張圖片的色彩調色盤 (Color Palette)，列出主要的 5 種顏色代碼 (Hex)。', description: '設計輔助。', category: 'technical' },
  { id: 'i_new_t2', label: '構圖線輔助', prompt: '在圖片上疊加三分法、黃金螺旋或對角線的構圖輔助線，以分析其構圖。', description: '攝影教學。', category: 'technical' },
  { id: 'i_new_t3', label: '熱點分析', prompt: '預測這張圖片中最吸引人眼球的視覺熱點 (Saliency Map)。', description: '視覺行銷。', category: 'technical' },
  
  // Creative (Advanced Edit)
  { id: 'i_adv_1', label: '液體化', prompt: '將圖片中的主體轉化為液體流動的形態，保持輪廓但改變材質為水或熔岩。', description: '材質轉換。', category: 'creative' },
  { id: 'i_adv_2', label: '水晶質感', prompt: '將畫面中的物體材質變為透明剔透的水晶或玻璃，呈現折射光芒。', description: '3D 材質。', category: 'creative' },
  { id: 'i_adv_3', label: '末日風格', prompt: '將場景改造為末日廢土風格，加入荒煙蔓草、廢墟與鏽蝕質感。', description: '場景改造。', category: 'creative' },
  { id: 'i_adv_4', label: '水下世界', prompt: '將整個場景移至水下，添加藍色色調、氣泡、波光紋理與海洋生物。', description: '環境轉換。', category: 'creative' },
  { id: 'i_adv_5', label: '金屬鑄造', prompt: '將物體質感轉變為拋光的金屬（如黃金、白銀或鉻），強調反射與光澤。', description: '金屬質感。', category: 'creative' },
  { id: 'i_new_c1', label: '雲朵化', prompt: '將物體轉化為雲朵的形態，漂浮在天空中，形狀保持可辨識。', description: '幻想風格。', category: 'creative' },
  { id: 'i_new_c2', label: '摺紙藝術', prompt: '將圖片內容變成摺紙 (Origami) 藝術，展現紙張的幾何摺痕。', description: '工藝風格。', category: 'creative' },
  { id: 'i_new_c3', label: '樂高化', prompt: '將世界變成由樂高積木 (LEGO) 搭建而成的樣子。', description: '玩具風格。', category: 'creative' },
  { id: 'i_new_c4', label: '羊毛氈', prompt: '將材質轉變為毛茸茸的羊毛氈 (Needle Felting) 質感。', description: '可愛風格。', category: 'creative' },
  { id: 'i_new_c5', label: '食物造景', prompt: '將風景中的山脈變成麵包，河流變成牛奶，樹木變成花椰菜。', description: '微縮攝影。', category: 'creative' },
  { id: 'i_new_c6', label: '雙重曝光', prompt: '將這張人像與森林/星空風景進行雙重曝光 (Double Exposure) 合成。', description: '藝術合成。', category: 'creative' },
  { id: 'i_new_c7', label: '石化效果', prompt: '將一切變為古老的岩石雕像，帶有青苔與裂痕。', description: '神話風格。', category: 'creative' },
];

// --- TEXT TO IMAGE CATEGORIES & PROMPTS ---

export const TXT2IMG_CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'photography', label: '專業攝影' },
  { id: 'art_illustration', label: '藝術與插畫' },
  { id: 'design', label: '設計與 3D' },
  { id: 'fantasy', label: '奇幻科幻' },
  { id: 'technical', label: '邏輯與科技' },
  { id: 'fashion', label: '時尚與空間' }, // New
];

export const TXT2IMG_PROMPTS: PromptTemplate[] = [
  // --- Photography (攝影) ---
  // Subcategory: Portrait (人像)
  { id: 'p_portrait_1', label: '人像 | 電影質感', subcategory: '人像攝影', prompt: '特寫人像，電影質感，85mm 鏡頭，f/1.8 光圈，淺景深，林布蘭光，富有情感的眼神，高解析度皮膚紋理。', description: '大片質感。', category: 'photography' },
  { id: 'p_portrait_2', label: '人像 | 魏斯安德森風', subcategory: '人像攝影', prompt: '魏斯安德森 (Wes Anderson) 風格人像，置中構圖，粉嫩色調，對稱美學，古怪而時尚的服裝，直視鏡頭。', description: '置中對稱。', category: 'photography' },
  { id: 'p_portrait_3', label: '人像 | 黑色電影', subcategory: '人像攝影', prompt: '黑色電影 (Film Noir) 風格，高對比黑白攝影，百葉窗陰影投射在臉上，神秘氛圍，煙霧繚繞，偵探造型。', description: '懸疑黑白。', category: 'photography' },
  { id: 'p_portrait_4', label: '人像 | 時尚 Vogue', subcategory: '人像攝影', prompt: 'Vogue 雜誌封面風格，前衛時尚穿搭，攝影棚燈光，純色背景，自信的姿勢，高銳利度，4k。', description: '時尚大片。', category: 'photography' },
  { id: 'p_portrait_5', label: '人像 | 底片感', subcategory: '人像攝影', prompt: 'Kodak Portra 400 底片質感，自然光，生活感抓拍，顆粒感，漏光效果，溫暖懷舊的色調。', description: '日系底片。', category: 'photography' },
  { id: 'p_new_1', label: '人像 | 賽博龐克', subcategory: '人像攝影', prompt: '賽博龐克風格人像，霓虹燈映照在臉上，藍紫色調，未來感服飾，雨夜背景，高反差。', description: '未來風格。', category: 'photography' },
  { id: 'p_new_2', label: '人像 | 文藝復興', subcategory: '人像攝影', prompt: '文藝復興時期油畫光影的攝影作品，柔和的窗光 (Chiaroscuro)，優雅的姿態，古典服飾，油畫質感。', description: '古典美學。', category: 'photography' },
  { id: 'p_new_3', label: '人像 | 雙重曝光', subcategory: '人像攝影', prompt: '藝術雙重曝光攝影，人像輪廓內填充著森林與星空的影像，夢幻，超現實主義。', description: '藝術合成。', category: 'photography' },
  
  // Subcategory: Landscape (風景)
  { id: 'p_land_1', label: '風景 | 黃金時刻', subcategory: '風景攝影', prompt: '壯麗的山脈風景，黃金時刻 (Golden Hour) 柔和光線，日落餘暉，廣角鏡頭，細節豐富，史詩感。', description: '日落大景。', category: 'photography' },
  { id: 'p_land_2', label: '風景 | 賽博都市', subcategory: '風景攝影', prompt: '未來的賽博龐克城市夜景，雨夜，霓虹燈反射在濕潤的路面，高聳的摩天大樓，飛行車，藍紫冷色調。', description: '未來城市。', category: 'photography' },
  { id: 'p_land_3', label: '風景 | 極簡主義', subcategory: '風景攝影', prompt: '極簡主義風景攝影，茫茫雪地中的一棵枯樹，大量留白，高對比，寧靜孤寂的氛圍，黑白風格。', description: '禪意極簡。', category: 'photography' },
  { id: 'p_land_4', label: '風景 | 無人機視角', subcategory: '風景攝影', prompt: '無人機俯瞰視角 (Drone shot)，垂直向下拍攝蜿蜒的海岸公路，海浪拍打岩石，幾何構圖，高飽和度。', description: '上帝視角。', category: 'photography' },
  { id: 'p_land_5', label: '風景 | 迷霧森林', subcategory: '風景攝影', prompt: '清晨的迷霧森林，陽光透過樹葉灑下 (Tyndall Effect)，神秘幽靜，綠色調，長焦壓縮感。', description: '森林秘境。', category: 'photography' },
  { id: 'p_new_4', label: '風景 | 街頭攝影', subcategory: '風景攝影', prompt: '東京澀谷街頭雨景，擁擠的人潮與雨傘，霓虹招牌倒影，電影感，寫實紀實風格。', description: '都市紀實。', category: 'photography' },
  { id: 'p_new_5', label: '風景 | 極光夜空', subcategory: '風景攝影', prompt: '北極圈的極光夜景，綠色極光舞動在雪山之上，星空璀璨，長曝光，寧靜壯麗。', description: '自然奇觀。', category: 'photography' },
  
  // Subcategory: Macro & Food (微距與美食)
  { id: 'p_macro_1', label: '微距 | 昆蟲複眼', subcategory: '微距與美食', prompt: '極致微距攝影，拍攝昆蟲的複眼細節，銳利清晰，背景虛化，色彩斑斕，微觀世界。', description: '生物細節。', category: 'photography' },
  { id: 'p_macro_2', label: '美食 | 誘人漢堡', subcategory: '微距與美食', prompt: '商業美食攝影，多汁的牛肉漢堡，起司融化流下，新鮮生菜，水珠，頂光與背光，令人垂涎欲滴，4k。', description: '商業美食。', category: 'photography' },
  { id: 'p_macro_3', label: '微距 | 水滴折射', subcategory: '微距與美食', prompt: '拍攝花瓣上的露珠，水滴中折射出花朵的倒影，晶瑩剔透，微距鏡頭，夢幻散景。', description: '光影折射。', category: 'photography' },
  { id: 'p_macro_4', label: '美食 | 咖啡拉花', subcategory: '微距與美食', prompt: '俯拍一杯精緻的拿鐵拉花，旁邊放著一本書和眼鏡，早晨陽光灑落，溫馨舒適的氛圍 (Hygge)。', description: '生活情境。', category: 'photography' },
  { id: 'p_macro_5', label: '微距 | 電路板', subcategory: '微距與美食', prompt: '主機板電路的微距特寫，金屬接點與晶片，科技藍光，景深極淺，展現精密工藝。', description: '科技質感。', category: 'photography' },
  { id: 'p_new_6', label: '美食 | 懸浮食材', subcategory: '微距與美食', prompt: '解構美食攝影，新鮮食材（蔬菜、水果、香料）懸浮在空中，高速攝影，動態感，明亮的背景。', description: '創意美食。', category: 'photography' },

  // --- Art & Illustration (藝術與插畫) ---
  // Subcategory: Painting (繪畫)
  { id: 'a_paint_1', label: '繪畫 | 印象派', subcategory: '繪畫風格', prompt: '莫內風格印象派油畫，睡蓮池塘，光影斑駁，筆觸明顯，色彩朦朧柔和，浪漫氛圍。', description: '莫內風。', category: 'art_illustration' },
  { id: 'a_paint_2', label: '繪畫 | 浮世繪', subcategory: '繪畫風格', prompt: '日本浮世繪風格，葛飾北齋「神奈川沖浪裏」風格的海浪與富士山，線條剛勁，復古配色。', description: '浮世繪。', category: 'art_illustration' },
  { id: 'a_paint_3', label: '繪畫 | 水彩插畫', subcategory: '繪畫風格', prompt: '清新透明的水彩插畫，雨後的街道，色彩暈染，筆觸輕盈，留白，富有詩意。', description: '透明水彩。', category: 'art_illustration' },
  { id: 'a_paint_4', label: '繪畫 | 梵谷風', subcategory: '繪畫風格', prompt: '梵谷「星夜」風格，旋轉的星空與柏樹，厚重的油畫筆觸 (Impasto)，強烈對比色，充滿動感。', description: '後印象派。', category: 'art_illustration' },
  { id: 'a_paint_5', label: '繪畫 | 墨水速寫', subcategory: '繪畫風格', prompt: '鋼筆淡彩速寫，歐洲古鎮街景，線條凌亂而有活力，局部上色，都市速寫 (Urban Sketching)。', description: '速寫手繪。', category: 'art_illustration' },
  { id: 'a_new_1', label: '繪畫 | 水墨山水', subcategory: '繪畫風格', prompt: '中國傳統水墨山水畫，潑墨技法，崇山峻嶺，雲霧繚繞，意境深遠，留白藝術。', description: '東方美學。', category: 'art_illustration' },
  { id: 'a_new_2', label: '繪畫 | 點描派', subcategory: '繪畫風格', prompt: '秀拉 (Seurat) 點描派風格，由無數彩色小點組成的公園午後場景，視覺混色效果。', description: '點描藝術。', category: 'art_illustration' },

  // Subcategory: Anime & Comic (動漫與漫畫)
  { id: 'a_anime_1', label: '動漫 | 吉卜力', subcategory: '動漫風格', prompt: '吉卜力工作室風格，宮崎駿畫風，綠意盎然的夏日鄉村，藍天白雲，細節豐富的背景，治癒系。', description: '宮崎駿風。', category: 'art_illustration' },
  { id: 'a_anime_2', label: '動漫 | 賽博龐克', subcategory: '動漫風格', prompt: '攻殼機動隊風格，90 年代賽博龐克動畫，高科技義肢少女，霓虹城市背景，Cel Shading，復古動畫質感。', description: '經典賽博。', category: 'art_illustration' },
  { id: 'a_anime_3', label: '漫畫 | 美漫英雄', subcategory: '動漫風格', prompt: '經典美式超級英雄漫畫封面，粗獷的墨線，強烈的動態姿勢，Ben-Day 網點效果，誇張的肌肉線條。', description: '美漫風格。', category: 'art_illustration' },
  { id: 'a_anime_4', label: '動漫 | 新海誠', subcategory: '動漫風格', prompt: '新海誠風格，極致唯美的光影，璀璨的星空與流星，精細的都市背景，高飽和度，每一幀都是桌布。', description: '光影壁紙。', category: 'art_illustration' },
  { id: 'a_anime_5', label: '漫畫 | 恐怖伊藤', subcategory: '動漫風格', prompt: '伊藤潤二風格恐怖漫畫，黑白線條，詭異的螺旋圖案，驚悚的表情，陰鬱壓抑的氛圍。', description: '日式恐怖。', category: 'art_illustration' },
  { id: 'a_new_3', label: '漫畫 | 法式漫畫', subcategory: '動漫風格', prompt: '墨必斯 (Moebius) 風格，法式科幻漫畫，精細的線條，淡雅的色彩，奇幻的異星風景，超現實感。', description: '歐美漫畫。', category: 'art_illustration' },
  { id: 'a_new_4', label: '動漫 | 像素藝術', subcategory: '動漫風格', prompt: '16-bit 像素藝術 (Pixel Art)，復古 RPG 遊戲場景，冒險者在營火旁休息，細節豐富。', description: '懷舊遊戲。', category: 'art_illustration' },

  // --- Design & 3D (設計與 3D) ---
  // Subcategory: 3D Render (3D 渲染)
  { id: 'd_3d_1', label: '3D | 盲盒公仔', subcategory: '3D 渲染', prompt: '3D 盲盒公仔設計，可愛的太空人角色，Chibi 風格，OC 渲染 (Octane Render)，塑膠與霧面質感，柔光攝影棚。', description: '可愛公仔。', category: 'design' },
  { id: 'd_3d_2', label: '3D | 玻璃擬態', subcategory: '3D 渲染', prompt: '玻璃擬態 (Glassmorphism) 圖示設計，半透明磨砂玻璃質感，多彩漸層背景，懸浮感，現代 UI 風格。', description: 'UI 趨勢。', category: 'design' },
  { id: 'd_3d_3', label: '3D | 等距視角', subcategory: '3D 渲染', prompt: '低多邊形 (Low Poly) 等距視角 (Isometric) 房間，溫馨的遊戲玩家臥室，充滿細節，柔和暖光，Blender 渲染。', description: '小房間。', category: 'design' },
  { id: 'd_3d_4', label: '3D | 超寫實產品', subcategory: '3D 渲染', prompt: '高級香水瓶的產品渲染，金屬與玻璃質感，水花濺起的高速攝影效果，廣告級別光影，KeyShot 渲染。', description: '產品設計。', category: 'design' },
  { id: 'd_3d_5', label: '3D | 黏土定格', subcategory: '3D 渲染', prompt: '黏土定格動畫風格 (Claymation)，橡皮泥質感，指紋痕跡，手工製作的感覺，可愛的動物角色，微距。', description: '阿德曼風。', category: 'design' },
  { id: 'd_new_1', label: '3D | 遊戲資產', subcategory: '3D 渲染', prompt: '遊戲道具設計，一把傳說級的魔法水晶劍，發光特效，PBR 材質，Unreal Engine 5 渲染，細節展示。', description: '遊戲道具。', category: 'design' },
  { id: 'd_new_2', label: '3D | 抽象流體', subcategory: '3D 渲染', prompt: '抽象的彩色流體模擬，絲綢般的質感，漸層色彩，在空中流動，極簡主義背景，藝術感。', description: '抽象藝術。', category: 'design' },

  // Subcategory: Graphic Design (平面設計)
  { id: 'd_graphic_1', label: '設計 | 極簡 Logo', subcategory: '平面設計', prompt: '極簡主義 Logo 設計，以「狐狸」為主題，幾何線條，向量圖形，扁平化設計 (Flat Design)，橘色與白色。', description: '商標設計。', category: 'design' },
  { id: 'd_graphic_2', label: '設計 | 包裝設計', subcategory: '平面設計', prompt: '精緻的茶葉包裝設計，東方禪意風格，燙金工藝，宣紙質感，優雅的書法字體，展示樣機 (Mockup)。', description: '包裝樣機。', category: 'design' },
  { id: 'd_graphic_3', label: '設計 | 霓虹海報', subcategory: '平面設計', prompt: '復古 80 年代 Synthwave 音樂節海報，落日網格，棕櫚樹剪影，霓虹字體，VHS 雜訊效果。', description: '復古海報。', category: 'design' },
  { id: 'd_graphic_4', label: '設計 | 幾何圖形', subcategory: '平面設計', prompt: '包浩斯 (Bauhaus) 風格幾何海報，紅黃藍三原色，圓形三角形方形的構成，理性與秩序感。', description: '包浩斯。', category: 'design' },
  { id: 'd_graphic_5', label: '設計 | 貼紙藝術', subcategory: '平面設計', prompt: '街頭潮流風格貼紙設計，塗鴉字體，滑板文化，鮮豔色彩，粗輪廓線 (Bold Outline)，向量圖。', description: '潮流貼紙。', category: 'design' },
  { id: 'd_new_3', label: '設計 | App UI', subcategory: '平面設計', prompt: '現代化旅遊 App 的 UI 介面設計，首頁畫面，清晰的卡片式佈局，高品質風景圖，極簡導航列，Dribbble 風格。', description: 'UI 介面。', category: 'design' },
  { id: 'd_new_4', label: '設計 | 塔羅牌', subcategory: '平面設計', prompt: '新藝術風格 (Art Nouveau) 的塔羅牌設計，「月亮」牌面，繁複的邊框裝飾，慕夏風格，神秘優雅。', description: '卡牌插畫。', category: 'design' },

  // Subcategory: Fashion & Space (時尚與空間)
  { id: 'fs_1', label: '時尚 | 伸展台', subcategory: '時尚設計', prompt: '巴黎時裝週伸展台，模特兒穿著前衛的解構主義服裝，誇張的剪裁，黑白色調，聚光燈。', description: '時裝設計。', category: 'fashion' },
  { id: 'fs_2', label: '時尚 | 運動鞋', subcategory: '時尚設計', prompt: '潮牌運動鞋設計概念圖，未來感流線型，異材質拼接，鮮豔配色，懸浮展示。', description: '鞋類設計。', category: 'fashion' },
  { id: 'fs_3', label: '時尚 | 珠寶設計', subcategory: '時尚設計', prompt: '高級珠寶設計手繪稿，鑽石項鍊，細膩的鉛筆線條與水彩上色，標註寶石規格。', description: '珠寶草圖。', category: 'fashion' },
  { id: 'fs_4', label: '空間 | 北歐風', subcategory: '室內設計', prompt: '明亮通透的北歐風客廳，淺色木地板，灰色布沙發，綠色植栽，大片落地窗，自然光。', description: '居家裝潢。', category: 'fashion' },
  { id: 'fs_5', label: '空間 | 工業風', subcategory: '室內設計', prompt: 'Loft 工業風辦公室，紅磚牆，外露管線，黑色鐵件家具，愛迪生燈泡，復古皮革沙發。', description: '商業空間。', category: 'fashion' },
  { id: 'fs_6', label: '空間 | 日式庭園', subcategory: '室內設計', prompt: '寧靜的日式枯山水庭園，白沙波紋，青苔石頭，竹林背景，禪意氛圍。', description: '景觀設計。', category: 'fashion' },

  // --- Fantasy & Sci-Fi (奇幻與科幻) ---
  // Subcategory: Fantasy (奇幻)
  { id: 'f_fantasy_1', label: '奇幻 | 史詩巨龍', subcategory: '奇幻世界', prompt: '史詩般的奇幻場景，巨龍盤踞在古老城堡的塔樓上，噴吐火焰，騎士對決，戲劇性光影，魔戒風格。', description: 'D&D 風格。', category: 'fantasy' },
  { id: 'f_fantasy_2', label: '奇幻 | 精靈森林', subcategory: '奇幻世界', prompt: '魔法精靈森林，發光的植物與蘑菇，飛舞的螢火蟲，空靈的氛圍，夢幻紫色調，Unreal Engine 5。', description: '魔法秘境。', category: 'fantasy' },
  { id: 'f_fantasy_3', label: '奇幻 | 蒸汽龐克', subcategory: '奇幻世界', prompt: '蒸汽龐克飛船，黃銅齒輪與蒸汽管道，維多利亞風格的城市，雲海之上，冒險氛圍。', description: '機械美學。', category: 'fantasy' },
  { id: 'f_fantasy_4', label: '奇幻 | 克蘇魯', subcategory: '奇幻世界', prompt: '克蘇魯神話風格，深海中的不可名狀之物，觸手，古老遺跡，陰暗壓抑，Lovecraftian horror。', description: '宇宙恐怖。', category: 'fantasy' },
  { id: 'f_fantasy_5', label: '奇幻 | 塔羅牌', subcategory: '奇幻世界', prompt: '精美的塔羅牌插畫，「命運之輪」牌面，新藝術風格 (Art Nouveau)，繁複的裝飾邊框，神秘學符號。', description: '卡牌插畫。', category: 'fantasy' },

  // Subcategory: Sci-Fi (科幻)
  { id: 'f_scifi_1', label: '科幻 | 太空歌劇', subcategory: '科幻未來', prompt: '壯觀的太空艦隊戰役，雷射光束交錯，巨大的母艦，星雲背景，星際大戰風格，電影級特效。', description: '星際大戰。', category: 'fantasy' },
  { id: 'f_scifi_2', label: '科幻 | 廢土風格', subcategory: '科幻未來', prompt: '末日後的廢土世界，荒涼的沙漠，廢棄的生鏽機器人，孤獨的倖存者，瘋狂麥斯 (Mad Max) 風格。', description: '末日生存。', category: 'fantasy' },
  { id: 'f_scifi_3', label: '科幻 | 生化人', subcategory: '科幻未來', prompt: '半人半機械的生化人 (Cyborg) 特寫，露出的電路與金屬骨骼，發光的眼睛，未來科技感，超寫實。', description: '人機融合。', category: 'fantasy' },
  { id: 'f_scifi_4', label: '科幻 | 戴森球', subcategory: '科幻未來', prompt: '巨大的戴森球結構包圍恆星，宏偉的太空工程，細節豐富的太陽能板陣列，硬科幻風格 (Hard Sci-Fi)。', description: '巨型結構。', category: 'fantasy' },
  { id: 'f_scifi_5', label: '科幻 | 傳送門', subcategory: '科幻未來', prompt: '開啟的時空傳送門，旋轉的能量渦流，通往異世界的景象，實驗室背景，藍色與橙色對比。', description: '時空旅行。', category: 'fantasy' },

  // --- Logic & Technical (邏輯與科技) ---
  { id: 'tech_vis_1', label: '邏輯 | 系統架構', subcategory: '概念視覺化', prompt: '現代化雲端微服務架構圖，3D 等距視角，伺服器叢集，資料庫與 API Gateway 圖示，科技藍光，連接線與資料流。', description: '架構圖。', category: 'technical' },
  { id: 'tech_vis_2', label: '邏輯 | 神經網絡', subcategory: '概念視覺化', prompt: '抽象的神經網絡可視化，發光的節點與突觸連接，複雜的網絡結構，深色背景，象徵人工智慧與深度學習。', description: 'AI 概念。', category: 'technical' },
  { id: 'tech_vis_3', label: '邏輯 | 區塊鏈', subcategory: '概念視覺化', prompt: '區塊鏈概念圖，數位方塊鏈條，加密鎖，分散式網絡節點，金色與藍色，象徵安全與去中心化。', description: '加密技術。', category: 'technical' },
  { id: 'tech_vis_4', label: '邏輯 | 數據流', subcategory: '概念視覺化', prompt: '大數據流動的視覺化表現，光纖傳輸，二進位代碼雨 (Matrix style)，資訊高速公路，動感模糊。', description: '資訊流。', category: 'technical' },
  { id: 'tech_vis_5', label: '邏輯 | 量子運算', subcategory: '概念視覺化', prompt: '量子電腦晶片特寫，超導體迴路，極低溫冷卻管，充滿未來感的金色與銅色金屬質感，實驗室環境。', description: '量子科技。', category: 'technical' },
  { id: 'tech_vis_6', label: '邏輯 | 心智圖', subcategory: '概念視覺化', prompt: '複雜而精美的心智圖 (Mind Map) 插畫，從中心大腦發散出的創意樹狀圖，豐富的圖標與關鍵字，彩色鉛筆風格。', description: '思維擴散。', category: 'technical' },
  { id: 'tech_vis_7', label: '邏輯 | 駭客任務', subcategory: '概念視覺化', prompt: '駭客任務風格的綠色代碼瀑布，黑色背景，數位雨，神秘且具有科技感的氛圍。', description: '代碼雨。', category: 'technical' },
  { id: 'tech_vis_8', label: '邏輯 | 虛擬實境', subcategory: '概念視覺化', prompt: '戴著 VR 頭顯的人，周圍漂浮著虛擬介面與全息投影，虛實結合的視覺效果，元宇宙概念。', description: 'VR/AR。', category: 'technical' },
  { id: 'tech_vis_9', label: '邏輯 | 生物科技', subcategory: '概念視覺化', prompt: 'DNA 雙螺旋結構的 3D 渲染，發光的鹼基對，漂浮在微觀細胞環境中，醫療科技感，藍綠色調。', description: '基因工程。', category: 'technical' },
  { id: 'tech_vis_10', label: '邏輯 | 智慧城市', subcategory: '概念視覺化', prompt: '未來的智慧城市模型，物聯網連接線，無人機物流，綠能建築，數據儀表板覆蓋在城市上空。', description: 'IoT 城市。', category: 'technical' },
  { id: 'tech_vis_11', label: '邏輯 | 網路安全', subcategory: '概念視覺化', prompt: '網路安全盾牌概念圖，數位防護罩抵擋紅色病毒攻擊，電路板背景，象徵資安防禦。', description: '資安防護。', category: 'technical' },
  { id: 'tech_vis_12', label: '邏輯 | 自動化', subcategory: '概念視覺化', prompt: '工業 4.0 自動化生產線，機械手臂精密組裝，傳送帶，乾淨明亮的智慧工廠，橙色與灰色配色。', description: '工業 4.0。', category: 'technical' },
];

// --- IMG2TXT CATEGORIES & PROMPTS ---

export const IMG2TXT_CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'caption', label: '描述與分析' },
  { id: 'extract', label: '提取與識別 (OCR)' },
  { id: 'convert', label: '轉換與解題' },
  { id: 'object', label: '物品與人物' },
  { id: 'creative', label: '創意編劇' },
];

export const IMG2TXT_PROMPTS: PromptTemplate[] = [
  // Caption (描述)
  { id: 'it_cap_1', label: '詳細描述', prompt: '請非常詳細地描述這張圖片的內容，包括場景、人物、動作、物體、顏色、光線和氛圍。', description: '視覺轉文字。', category: 'caption' },
  { id: 'it_cap_2', label: 'IG 貼文文案', prompt: '請根據這張圖片撰寫一篇吸引人的 Instagram 貼文，包含適當的 Emoji 和 Hashtags，語氣要活潑有趣。', description: '社群行銷。', category: 'caption' },
  { id: 'it_cap_3', label: '無障礙描述 (Alt Text)', prompt: '請為這張圖片撰寫一段簡潔準確的 Alt Text (替代文字)，供視障人士使用螢幕閱讀器時理解圖片內容。', description: '無障礙輔助。', category: 'caption' },
  { id: 'it_cap_4', label: '藝術鑑賞', prompt: '假設你是一位藝術評論家，請分析這幅畫作的構圖、色彩運用、筆觸技巧以及它所傳達的情感與意境。', description: '專業藝評。', category: 'caption' },
  { id: 'it_cap_5', label: '室內設計建議', prompt: '分析這張室內照片的裝潢風格，並提出 3 個具體的改進建議（如軟裝搭配、家具擺設），以提升空間質感。', description: '裝潢顧問。', category: 'caption' },
  { id: 'it_cap_6', label: '風景意境', prompt: '請用優美的散文筆觸描寫這張風景照，著重於光影變化與它帶給人的寧靜或震撼感受。', description: '文學描寫。', category: 'caption' },
  { id: 'it_cap_7', label: '新聞標題', prompt: '假設這是一張新聞照片，請為它下三個聳動但符合事實的新聞標題。', description: '媒體視角。', category: 'caption' },
  { id: 'it_cap_8', label: '情緒解讀', prompt: '專注分析圖片中人物的面部表情與肢體語言，解讀他們當下可能的情緒狀態與互動關係。', description: '心理分析。', category: 'caption' },
  { id: 'it_cap_9', label: '構圖分析', prompt: '從攝影學角度分析這張照片的構圖技巧（如三分法、引導線、景深），並評價其視覺引導效果。', description: '攝影教學。', category: 'caption' },
  { id: 'it_cap_10', label: '時間地點推測', prompt: '根據圖片中的光線、植被、建築風格或路標，推測這張照片可能的拍攝時間（季節/時段）與地理位置。', description: '偵探推理。', category: 'caption' },
  { id: 'it_cap_11', label: '安全檢查', prompt: '檢視這張工廠或工地照片，指出畫面中潛在的安全隱患或未穿著防護裝備的違規事項。', description: '工安辨識。', category: 'caption' },
  { id: 'it_cap_12', label: '電影鏡頭分析', prompt: '分析這張電影劇照的鏡頭語言、燈光佈置與色彩心理學，說明導演試圖傳達的敘事隱喻。', description: '影視分析。', category: 'caption' },
  { id: 'it_cap_13', label: '寵物情緒', prompt: '觀察這隻寵物的耳朵、尾巴狀態與眼神，解讀牠目前的心情（如放鬆、警戒、想玩）。', description: '動物行為。', category: 'caption' },
  { id: 'it_new_1', label: '風水分析 (趣味)', prompt: '以風水師的角度（趣味性質），評論這張房間或辦公室照片的擺設，並給出招財或招桃花的建議。', description: '趣味玄學。', category: 'caption' },
  { id: 'it_new_2', label: '手相/面相 (趣味)', prompt: '（趣味性質）根據這張手掌或面部照片，分析其特徵並給出一段積極正向的運勢解讀。', description: '趣味算命。', category: 'caption' },
  
  // Extract (OCR)
  { id: 'it_ext_1', label: '文字提取 (OCR)', prompt: '請將圖片中的所有文字完整轉錄出來，並保持原有的段落結構。', description: '圖片轉文字。', category: 'extract' },
  { id: 'it_ext_2', label: '菜單翻譯', prompt: '識別這張菜單圖片中的菜名，將其翻譯成中文，並簡單介紹每道菜的內容與口味。', description: '旅遊助手。', category: 'extract' },
  { id: 'it_ext_3', label: '名片整理', prompt: '從這張名片中提取姓名、職稱、電話、Email 與公司地址，整理成 JSON 格式。', description: '資料建檔。', category: 'extract' },
  { id: 'it_ext_4', label: '手寫辨識', prompt: '盡力辨識這張圖片中潦草的手寫筆記，並將其整理為數位化的文字檔案。', description: '筆記數位化。', category: 'extract' },
  { id: 'it_ext_5', label: '發票記帳', prompt: '讀取這張發票或收據的日期、品項與總金額，並分類支出項目（如餐飲、交通）。', description: '財務助手。', category: 'extract' },
  { id: 'it_ext_6', label: '表格轉 Excel', prompt: '將圖片中的表格數據提取出來，並以 CSV 格式輸出，方便貼上 Excel。', description: '數據處理。', category: 'extract' },
  { id: 'it_ext_7', label: '合約審閱', prompt: '識別這份合約文件的關鍵條款，並摘要出甲乙雙方的主要權利與義務，特別標註罰則部分。', description: '法律輔助。', category: 'extract' },
  { id: 'it_ext_8', label: '程式碼截圖', prompt: '將這張程式碼截圖轉換為可執行的文字代碼，並檢查是否有明顯語法錯誤。', description: '代碼復原。', category: 'extract' },
  { id: 'it_ext_9', label: '書籍摘錄', prompt: '提取書頁照片中的文字，並為這段內容撰寫 100 字的讀書筆記摘要。', description: '學習整理。', category: 'extract' },
  { id: 'it_ext_10', label: '路標識別', prompt: '識別圖片中的路牌與交通標誌，告訴我這些指示牌代表的行車規則與方向。', description: '導航輔助。', category: 'extract' },
  { id: 'it_new_ocr_1', label: '手寫信數位化', prompt: '將這封手寫信件轉換為數位文字，保留其溫暖的語氣，並摘要其情感重點。', description: '情感保存。', category: 'extract' },
  { id: 'it_new_ocr_2', label: 'WiFi 密碼提取', prompt: '從這張路由器背面或告示牌的照片中，找出並列出 WiFi 名稱 (SSID) 與密碼。', description: '生活便利。', category: 'extract' },

  // Convert (轉換與解題)
  { id: 'it_con_1', label: '數學解題', prompt: '請一步步解開這張圖片中的數學題目，並解釋每個步驟的邏輯。', description: '家教老師。', category: 'convert' },
  { id: 'it_con_2', label: '截圖轉程式碼', prompt: '這是一個網頁/App 的 UI 截圖，請生成能實現此佈局的 HTML/Tailwind CSS 程式碼。', description: '前端切版。', category: 'convert' },
  { id: 'it_con_3', label: '圖表分析', prompt: '分析這張統計圖表（Bar/Line/Pie Chart），解讀數據趨勢、極值與背後的含義。', description: '數據洞察。', category: 'convert' },
  { id: 'it_con_4', label: '流程圖轉文字', prompt: '將這張流程圖圖片轉換為條列式的步驟說明文字，解釋流程的邏輯判斷。', description: '邏輯解析。', category: 'convert' },
  { id: 'it_con_5', label: '樂譜轉 MIDI', prompt: '分析這張五線譜圖片，列出音符序列、節拍與調號。', description: '音樂輔助。', category: 'convert' },
  { id: 'it_new_con_1', label: '化學式平衡', prompt: '識別圖片中的化學反應式，並協助平衡係數，解釋反應類型。', description: '化學家教。', category: 'convert' },
  { id: 'it_new_con_2', label: '物理力學分析', prompt: '分析這張物理題目圖片（如滑輪、斜面），畫出受力圖分析 (文字描述) 並列出解題公式。', description: '物理家教。', category: 'convert' },

  // Object Analysis (物品)
  { id: 'it_obj_1', label: '卡路里計算', prompt: '辨識圖片中的食物，估算每樣食物的份量與卡路里，並提供總熱量估計。', description: '飲食控制。', category: 'object' },
  { id: 'it_obj_2', label: '植物辨識', prompt: '請問這張圖片中的植物是什麼品種？請提供它的名稱、學名以及照顧方式（日照、澆水）。', description: '園藝助手。', category: 'object' },
  { id: 'it_obj_3', label: '寵物/動物辨識', prompt: '辨識圖片中的動物品種，並介紹其性格特徵與習性。', description: '百科全書。', category: 'object' },
  { id: 'it_obj_4', label: '車型辨識', prompt: '辨識這輛汽車的品牌、型號與大致年份，並列出其主要規格特色。', description: '車迷鑑定。', category: 'object' },
  { id: 'it_obj_5', label: '產品比價', prompt: '識別圖片中的商品型號，並列出它在市場上的大致價格區間與主要競爭對手。', description: '購物助手。', category: 'object' },
  { id: 'it_obj_6', label: '歷史文獻', prompt: '辨識這份古文件或手稿的內容與年代，解釋其歷史背景與文化意義。', description: '考古研究。', category: 'object' },
  { id: 'it_obj_7', label: '產品設計評估', prompt: '從工業設計角度評估這個產品的外觀、人體工學與材質運用，指出其設計亮點與缺點。', description: '產品分析。', category: 'object' },
  { id: 'it_obj_8', label: '使用指南', prompt: '這是一個產品或設備的照片，請告訴我這通常是用來做什麼的？並列出基本的使用步驟。', description: '說明書。', category: 'object' },
  { id: 'it_obj_9', label: '清潔保養', prompt: '識別這個物品的材質（如皮革、絲綢、木頭），並提供專業的清潔與保養建議，避免損壞。', description: '生活智慧。', category: 'object' },
  { id: 'it_obj_10', label: '由來考據', prompt: '識別這個古董或紀念品的風格特徵，推測其可能的產地、年代與歷史淵源。', description: '鑑寶。', category: 'object' },
  { id: 'it_obj_11', label: 'RPG 角色卡', prompt: '根據這張人物圖片，生成一張 RPG 角色卡，包含：姓名、職業、種族、力量/智力/敏捷數值、特殊技能與背景故事。', description: '遊戲人設。', category: 'object' },
  { id: 'it_obj_12', label: 'MBTI 分析', prompt: '觀察圖片中人物的穿搭、表情與環境，大膽推測其 MBTI 人格類型，並說明推測依據。', description: '性格分析。', category: 'object' },
  { id: 'it_new_obj_1', label: '寶石鑑定', prompt: '分析這顆寶石或珠寶的顏色、切工與種類（僅供參考），並給出保養建議。', description: '珠寶賞析。', category: 'object' },
  { id: 'it_new_obj_2', label: '郵票/錢幣估價', prompt: '識別這枚郵票或錢幣的發行國家與年份，並介紹其收藏價值背景。', description: '收藏助手。', category: 'object' },
  { id: 'it_new_obj_3', label: '膚質分析', prompt: '（免責聲明：僅供參考）分析臉部照片的膚質狀況，如乾燥、油性或痘痘，並給予一般的保養建議。', description: '美容顧問。', category: 'object' },
  { id: 'it_new_obj_4', label: '穿搭評分', prompt: '對這套穿搭進行 1-10 分的評分，並給出三個具體的改進或配件搭配建議。', description: '時尚顧問。', category: 'object' },
  { id: 'it_new_obj_5', label: '酒標識別', prompt: '識別這瓶酒的酒標，介紹其產區、葡萄品種、口感特色與適合搭配的食物。', description: '品酒助手。', category: 'object' },

  // Creative Script (創意編劇)
  { id: 'it_script_1', label: '電影劇本', prompt: '以此圖片為電影的一個場景，撰寫一段劇本，包含場景標題、角色動作與對白，營造懸疑氛圍。', description: '編劇靈感。', category: 'creative' },
  { id: 'it_script_2', label: '短影音腳本', prompt: '根據這張圖片，設計一個 15 秒的 TikTok/Reels 短影音腳本，包含分鏡、旁白與配樂建議，目標是病毒式傳播。', description: '社群爆款。', category: 'creative' },
  { id: 'it_script_3', label: '廣告分鏡', prompt: '將這張圖片視為產品廣告的 Key Visual，發想其前後的廣告分鏡腳本 (Storyboard)，強調產品賣點。', description: '行銷創意。', category: 'creative' },
  { id: 'it_script_4', label: '起承轉合 (雙圖)', prompt: '（需上傳兩張以上圖片）將第一張圖作為故事開頭，最後一張圖作為結尾，請創作一個完整的故事，合理化中間的轉折。', description: '多圖敘事。', category: 'creative' },
  { id: 'it_script_5', label: '中間發生什麼', prompt: '（需上傳兩張圖片）這兩張圖分別代表事件的「前」與「後」，請推理並描述中間發生了什麼事，導致這樣的變化。', description: '推理補完。', category: 'creative' },
  { id: 'it_script_6', label: '紀錄片旁白', prompt: '以大衛·艾登堡 (David Attenborough) 的語氣，為這張大自然或動物圖片撰寫一段富有深度的紀錄片旁白。', description: '自然生態。', category: 'creative' },
  { id: 'it_script_7', label: '懸疑開頭', prompt: '以這張圖片為案發現場或線索，撰寫一部推理小說的開頭，埋下令人好奇的伏筆。', description: '小說創作。', category: 'creative' },
  { id: 'it_script_8', label: '廣播劇', prompt: '僅透過聲音與對話來呈現這張圖片的情境，撰寫一段廣播劇腳本，強調環境音效 (SFX)。', description: '聲音敘事。', category: 'creative' },
  { id: 'it_script_9', label: '互動小說', prompt: '這是一個文字冒險遊戲的場景，請描述現況，並給出三個選項供玩家選擇下一步行動。', description: '遊戲腳本。', category: 'creative' },
  { id: 'it_script_10', label: '迷因生成', prompt: '為這張圖片配上一個幽默、諷刺的迷因 (Meme) 文字，契合當下的網路流行語。', description: '梗圖製作。', category: 'creative' },
  { id: 'it_script_11', label: '情書創作', prompt: '將這張圖片視為定情之物或回憶場景，寫一封感人肺腑的情書給圖片中的對象。', description: '情感表達。', category: 'creative' },
  { id: 'it_script_12', label: '科幻日誌', prompt: '這是在外星球探索時拍下的照片，請以艦長日誌的形式記錄這個新發現的物種或遺跡。', description: '科幻設定。', category: 'creative' },
];

// --- IMG2VID CATEGORIES & PROMPTS ---

export const IMG2VID_CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'camera_movement', label: '運鏡技巧' },
  { id: 'physics', label: '物理動態' },
  { id: 'atmosphere', label: '環境氛圍' },
  { id: 'vfx', label: '特效與創意' },
];

export const IMG2VID_PROMPTS: PromptTemplate[] = [
  // Camera Movement (運鏡)
  { id: 'v_cam_1', label: '向右平移', prompt: 'Cinematic Pan Right: The camera moves smoothly horizontally to the right, revealing more of the scene.', description: '橫向運鏡。', category: 'camera_movement' },
  { id: 'v_cam_2', label: '推軌鏡頭 (In)', prompt: 'Slow Dolly In: The camera physically moves closer to the subject, increasing intimacy and focus.', description: '推進鏡頭。', category: 'camera_movement' },
  { id: 'v_cam_3', label: '推軌鏡頭 (Out)', prompt: 'Slow Dolly Out: The camera pulls back, revealing the subject\'s surroundings and context.', description: '拉遠鏡頭。', category: 'camera_movement' },
  { id: 'v_cam_4', label: '環繞運鏡', prompt: 'Orbit Shot: The camera circles around the central subject, showing it from different angles.', description: '360度環繞。', category: 'camera_movement' },
  { id: 'v_cam_5', label: '俯瞰鏡頭', prompt: 'Drone Shot / Birds Eye View: The camera soars above, looking down at the landscape moving slowly forward.', description: '無人機視角。', category: 'camera_movement' },
  { id: 'v_cam_6', label: '手持晃動', prompt: 'Handheld Camera: Slight camera shake to create a realistic, documentary-style feeling.', description: '紀錄片感。', category: 'camera_movement' },
  { id: 'v_cam_7', label: '變焦 (Zoom In)', prompt: 'Optical Zoom In: The lens zooms in on the focal point without the camera moving position.', description: '光學變焦。', category: 'camera_movement' },
  { id: 'v_cam_8', label: '滑軌側移', prompt: 'Slider Shot / Truck Left: Smooth lateral camera movement to the left, creating parallax with foreground objects.', description: '平滑側移。', category: 'camera_movement' },
  { id: 'v_cam_9', label: '搖臂升降', prompt: 'Crane Shot / Jib Up: The camera rises vertically from ground level to a high angle view.', description: '垂直升降。', category: 'camera_movement' },
  { id: 'v_cam_10', label: '極速變焦', prompt: 'Crash Zoom: A sudden, rapid zoom into the subject\'s face for dramatic or comedic effect.', description: '戲劇性變焦。', category: 'camera_movement' },
  { id: 'v_cam_11', label: '希區考克變焦', prompt: 'Dolly Zoom (Vertigo Effect): The camera moves backward while zooming in, distorting the perspective and background.', description: '暈眩效果。', category: 'camera_movement' },
  { id: 'v_cam_12', label: '低角度跟拍', prompt: 'Low Angle Tracking Shot: The camera follows the subject from a low angle, making them look powerful and dominant.', description: '仰視跟拍。', category: 'camera_movement' },
  { id: 'v_cam_new_1', label: '麥可貝旋轉', prompt: 'Bayhem Style: 360-degree rapid camera rotation around the subject with dynamic movement, action movie style.', description: '英雄式旋轉。', category: 'camera_movement' },
  { id: 'v_cam_new_2', label: '魏斯安德森橫移', prompt: 'Wes Anderson Style: Perfectly symmetrical, flat tracking shot moving purely sideways, whimsical movement.', description: '對稱橫移。', category: 'camera_movement' },
  { id: 'v_cam_new_3', label: 'FPV 穿越', prompt: 'FPV Drone Dive: Fast, acrobatic drone movement diving down a cliff or through a narrow gap.', description: '極限穿越。', category: 'camera_movement' },
  { id: 'v_cam_new_4', label: '第一人稱視角', prompt: 'POV Shot: Camera movement simulates seeing through a character\'s eyes, looking around naturally.', description: '主觀視角。', category: 'camera_movement' },
  { id: 'v_cam_new_5', label: '旋轉俯衝', prompt: 'Corkscrew Shot: Camera rotates while moving forward/downward, disorienting and dynamic.', description: '螺旋運動。', category: 'camera_movement' },
  
  // Physics & Motion (物理)
  { id: 'v_phy_1', label: '隨風飄動', prompt: 'Hair and clothes blowing gently in the wind, realistic physics animation.', description: '自然風吹。', category: 'physics' },
  { id: 'v_phy_2', label: '水流動態', prompt: 'Flowing water, river currents moving naturally, sunlight reflecting on the moving water surface.', description: '流水潺潺。', category: 'physics' },
  { id: 'v_phy_3', label: '火焰燃燒', prompt: 'Flickering fire in the fireplace, realistic flames and smoke rising slowly.', description: '火焰動態。', category: 'physics' },
  { id: 'v_phy_4', label: '煙霧繚繞', prompt: 'Thick fog rolling across the ground, swirling smoke patterns moving slowly.', description: '迷霧效果。', category: 'physics' },
  { id: 'v_phy_5', label: '車輛行駛', prompt: 'Cars moving along the highway, wheels turning, dynamic motion blur.', description: '交通動態。', category: 'physics' },
  { id: 'v_phy_6', label: '人群走動', prompt: 'People walking in the background, bustling city street atmosphere.', description: '城市活力。', category: 'physics' },
  { id: 'v_phy_7', label: '雲層流動', prompt: 'Time-lapse of clouds moving rapidly across the blue sky.', description: '縮時攝影。', category: 'physics' },
  { id: 'v_phy_8', label: '粒子消散', prompt: 'The object slowly dissolves into glowing particles and drifts away into the wind, magical effect.', description: '魔法消散。', category: 'physics' },
  { id: 'v_phy_9', label: '能量流動', prompt: 'Glowing energy currents flowing through the cables/object, pulsing light effects.', description: '科技能量。', category: 'physics' },
  { id: 'v_phy_10', label: '物體碎裂', prompt: 'The object cracks and shatters into pieces in slow motion, debris flying outward.', description: '爆破效果。', category: 'physics' },
  { id: 'v_phy_11', label: '液體潑濺', prompt: 'Slow motion liquid splash, droplets suspended in the air, fluid dynamics.', description: '液體廣告。', category: 'physics' },
  { id: 'v_phy_12', label: '布料模擬', prompt: 'Silk fabric waving elegantly in slow motion, realistic cloth simulation and folding.', description: '絲綢飄逸。', category: 'physics' },
  { id: 'v_phy_new_1', label: '花朵綻放', prompt: 'Time-lapse of a flower bud opening and blooming, detailed petal movement.', description: '生命綻放。', category: 'physics' },
  { id: 'v_phy_new_2', label: '雨滴落下', prompt: 'Raindrops hitting a puddle, creating ripples that expand outward.', description: '漣漪效果。', category: 'physics' },
  { id: 'v_phy_new_3', label: '玻璃破碎', prompt: 'Glass window shattering into thousands of shards, slow motion physics.', description: '碎裂瞬間。', category: 'physics' },
  { id: 'v_phy_new_4', label: '頭髮飄逸', prompt: 'Detailed hair strands flowing beautifully in slow motion wind, shampoo commercial style.', description: '髮絲動態。', category: 'physics' },
  { id: 'v_phy_new_5', label: '旗幟飄揚', prompt: 'Flag waving vigorously in a strong wind, fabric tension and movement.', description: '旗幟動態。', category: 'physics' },

  // Atmosphere (氛圍)
  { id: 'v_atm_1', label: '下雨場景', prompt: 'Heavy rain falling, raindrops splashing on surfaces, wet atmosphere.', description: '雨天。', category: 'atmosphere' },
  { id: 'v_atm_2', label: '下雪場景', prompt: 'Soft snow falling gently, accumulating on surfaces, winter atmosphere.', description: '雪景。', category: 'atmosphere' },
  { id: 'v_atm_3', label: '光影變化', prompt: 'Sunlight shifting as clouds pass by, dynamic lighting and shadows changing.', description: '光影流動。', category: 'atmosphere' },
  { id: 'v_atm_4', label: '灰塵顆粒', prompt: 'Dust motes dancing in a shaft of sunlight, cinematic lighting atmosphere.', description: '丁達爾光。', category: 'atmosphere' },
  { id: 'v_atm_5', label: '雷電交加', prompt: 'Stormy sky with lightning flashes illuminating the dark clouds.', description: '暴風雨。', category: 'atmosphere' },
  { id: 'v_atm_6', label: '櫻花飄落', prompt: 'Cherry blossom petals falling slowly in the breeze, romantic anime style.', description: '浪漫花瓣。', category: 'atmosphere' },
  { id: 'v_atm_new_1', label: '極光舞動', prompt: 'Aurora Borealis (Northern Lights) shifting and dancing across the night sky, green and purple colors.', description: '極光奇觀。', category: 'atmosphere' },
  { id: 'v_atm_new_2', label: '日出縮時', prompt: 'Sunrise time-lapse, sky changing colors from purple to orange to blue, sun rising over horizon.', description: '日出過程。', category: 'atmosphere' },
  { id: 'v_atm_new_3', label: '星軌旋轉', prompt: 'Star trails rotating in the night sky, time-lapse astrophotography effect.', description: '星空軌跡。', category: 'atmosphere' },
  { id: 'v_atm_new_4', label: '水底光束', prompt: 'Underwater view, light rays piercing through the water surface, caustic patterns moving on the floor.', description: '深海光影。', category: 'atmosphere' },

  // VFX (特效)
  { id: 'v_vfx_1', label: '賽博故障', prompt: 'Cyberpunk glitch effect, digital distortion, RGB separation, screen tearing.', description: '故障藝術。', category: 'vfx' },
  { id: 'v_vfx_2', label: '老電影感', prompt: 'Vintage film look, grain, scratches, flickering projector effect, sepia tone.', description: '膠卷質感。', category: 'vfx' },
  { id: 'v_vfx_3', label: '霓虹閃爍', prompt: 'Neon signs flickering on and off, buzzing light effect in a dark city street.', description: '霓虹夜景。', category: 'vfx' },
  { id: 'v_vfx_4', label: '鏡頭光暈', prompt: 'Anamorphic lens flares moving across the screen, cinematic sci-fi look.', description: 'JJ Abrams。', category: 'vfx' },
  { id: 'v_vfx_5', label: '熱浪變形', prompt: 'Heat haze distortion rising from the hot ground, mirage effect.', description: '高溫熱浪。', category: 'vfx' },
  { id: 'v_vfx_6', label: 'VHS 錄影帶', prompt: 'VHS tape tracking error, low resolution, color bleeding, retro 80s aesthetic.', description: 'VHS 風格。', category: 'vfx' },
  { id: 'v_vfx_new_1', label: '駭客任務', prompt: 'Matrix digital rain code falling in the foreground, green binary numbers.', description: '數位代碼。', category: 'vfx' },
  { id: 'v_vfx_new_2', label: '靈魂出竅', prompt: 'Ghosting trail effect following the subject\'s movement, psychedelic visual echo.', description: '殘影特效。', category: 'vfx' },
  { id: 'v_vfx_new_3', label: '時間倒流', prompt: 'Reverse motion, objects moving backwards, water flowing up, surreal effect.', description: '倒帶效果。', category: 'vfx' },
  { id: 'v_vfx_new_4', label: '漫畫速度線', prompt: 'Anime style speed lines rushing towards the center, intense action focus.', description: '速度感。', category: 'vfx' },
  { id: 'v_vfx_new_5', label: '多重分身', prompt: 'Kaleidoscope effect, mirroring the image multiple times, geometric patterns.', description: '萬花筒。', category: 'vfx' },
];
