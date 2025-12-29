import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

PROMPTS = {
    'professional': {
        "EN": """
                Create an executive summary of the document using Markdown formatting.

                **Instructions:**
                - Use **bold** for important terms and key concepts
                - Use *italic* for emphasis
                - Use ## for section headers
                - Use bullet points (- ) for lists
                - Highlight critical information with **bold**
                - Include key findings, main arguments, and conclusions
                - Organize in clear sections: Purpose, Key Points, Findings, Conclusions

                **Important:** At the end, add a "Keywords" section with 5-10 most important keywords in **bold**.

                Document content:
            """,

        "ID": """
                Buat ringkasan eksekutif dari dokumen berikut menggunakan format Markdown.

                **Instruksi:**
                - Gunakan **bold** untuk istilah penting dan konsep utama
                - Gunakan *italic* untuk penekanan
                - Gunakan ## untuk judul bagian
                - Gunakan bullet points (- ) untuk daftar
                - Sorot informasi penting dengan **bold**
                - Sertakan temuan utama, argumen utama, dan kesimpulan
                - Susun dalam bagian yang jelas: Tujuan, Poin Utama, Temuan, Kesimpulan

                **Penting:** Di bagian akhir, tambahkan bagian "Kata Kunci" berisi 5–10 kata kunci terpenting dalam **bold**.

                Isi dokumen:
            """,

        "CN": """
                请使用 Markdown 格式为以下文档创建一份执行摘要。

                **说明：**
                - 使用 **加粗** 标记重要术语和关键概念
                - 使用 *斜体* 表示强调
                - 使用 ## 作为章节标题
                - 使用项目符号 (- ) 作为列表
                - 用 **加粗** 突出关键信息
                - 包含关键发现、主要论点和结论
                - 按以下结构组织：目的、关键点、发现、结论

                **重要：** 在最后添加一个“关键词”部分，包含 5–10 个最重要的关键词，并使用 **加粗** 标出。

                文档内容：
            """,

        "JP": """
                以下の文書について、Markdown 形式を使用してエグゼクティブサマリーを作成してください。

                **指示：**
                - 重要な用語や概念には **太字** を使用する
                - 強調には *イタリック体* を使用する
                - セクション見出しには ## を使用する
                - 箇条書きには (- ) を使用する
                - 重要な情報は **太字** で強調する
                - 主要な発見、主な主張、結論を含める
                - 「目的」「重要ポイント」「発見」「結論」の構成で整理する

                **重要：** 最後に「キーワード」というセクションを追加し、5～10 個の重要なキーワードを **太字** で記載してください。

                文書内容：
            """,

        "KR": """
                다음 문서에 대해 Markdown 형식을 사용하여 실행 요약을 작성하세요.

                **지침:**
                - 중요한 용어와 핵심 개념은 **굵게** 표시
                - 강조는 *이탤릭체* 사용
                - 섹션 제목에는 ## 사용
                - 목록에는 (- ) 글머리 기호 사용
                - 중요한 정보는 **굵게** 강조
                - 주요 발견, 핵심 주장 및 결론 포함
                - 다음 구조로 구성: 목적, 핵심 요점, 발견, 결론

                **중요:** 마지막에 "키워드" 섹션을 추가하고, 가장 중요한 키워드 5~10개를 **굵게** 표시하세요.

                문서 내용:
            """
    },
    'simple': {
        'EN': """
                Create a simple, easy-to-read summary of the document using Markdown.

                **Instructions:**
                - Write in casual, conversational tone
                - Use short paragraphs
                - Use **bold** for important points
                - Use bullet points (- ) for easy scanning
                - Explain concepts in simple language
                - Make it fun and engaging to read
                - Avoid jargon and complex terms

                **Important:** At the end, add "## Main Takeaways" with 3-5 key points in bold.

                Document content:
            """,

        'ID': """
                Buat ringkasan dokumen yang sederhana dan mudah dibaca menggunakan Markdown.

                **Instruksi:**
                - Gunakan gaya bahasa santai dan mudah dipahami
                - Gunakan paragraf pendek
                - Gunakan **bold** untuk poin penting
                - Gunakan bullet points (- ) agar mudah dipindai
                - Jelaskan konsep dengan bahasa sederhana
                - Buat ringkasan terasa ringan dan enak dibaca
                - Hindari istilah teknis dan bahasa yang terlalu rumit

                **Penting:** Di akhir, tambahkan "## Poin Utama" berisi 3-5 poin kunci dalam **bold**.

                Isi dokumen:
            """,

        'CN': """
                使用 Markdown 创建一个简单、易读的文档摘要。

                **说明：**
                - 使用轻松、口语化的语气
                - 使用简短的段落
                - 用 **加粗** 标出重要内容
                - 使用项目符号（- ）方便快速浏览
                - 用简单的语言解释概念
                - 让内容有趣且容易阅读
                - 避免使用专业术语和复杂表达

                **重要：** 最后添加“## 主要要点”，列出 3-5 个 **加粗** 的关键点。

                文档内容：
            """,

        'JP': """
                Markdown を使って、読みやすくシンプルな要約を作成してください。

                **指示：**
                - カジュアルで親しみやすい口調で書く
                - 短い段落を使う
                - 重要なポイントは **太字** にする
                - 箇条書き（- ）を使って読みやすくする
                - 難しい概念はやさしい言葉で説明する
                - 楽しく読みやすい内容にする
                - 専門用語や難しい表現は避ける

                **重要：** 最後に「## 重要ポイント」として 3〜5 個の **太字** の要点を追加してください。

                ドキュメント内容：
            """,

        'KR': """
                Markdown을 사용하여 읽기 쉽고 간단한 요약을 작성하세요.

                **지침:**
                - 편안하고 대화체 스타일로 작성하세요
                - 짧은 단락을 사용하세요
                - 중요한 내용은 **굵게** 표시하세요
                - 빠르게 읽을 수 있도록 글머리표(- )를 사용하세요
                - 개념은 쉬운 언어로 설명하세요
                - 재미있고 읽기 편하게 작성하세요
                - 전문 용어나 어려운 표현은 피하세요

                **중요:** 마지막에 "## 주요 요점" 섹션을 추가하고 3~5개의 핵심 포인트를 **굵게** 작성하세요.

                문서 내용:
            """
    }
}


def summarize_text(text, language='EN', style='professional'):
    """Generate summary using Gemini AI"""
    prompt_template = PROMPTS.get(style, {}).get(language, PROMPTS['professional']['EN'])
    prompt = f"{prompt_template}{text[:12000]}"
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
    
    return response.text