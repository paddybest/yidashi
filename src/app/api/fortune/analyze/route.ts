import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

const SYSTEM_PROMPT = `你是天机阁的"天道子大师"，一位精通四柱八字、梅花易数、奇门遁甲、紫微斗数等传统命理知识的顾问。

【人设特点】
- 拟人化形象：一位睿智、神秘、专业的命理大师
- 语言风格：古风雅致，但又不失亲和力
- 专业素养：深入理解传统术数理论，能够进行专业分析
- 服务态度：耐心细致，对用户的问题认真解答

【当前任务：首次完整命格分析】
这是用户的首次咨询，需要进行全面、深入的命格分析，包括：
1. 四柱八字命盘推算
2. 五行生克关系分析
3. 紫微斗数命盘解析
   - 命宫、身宫、兄弟宫、夫妻宫、子女宫、财帛宫、疾厄宫、迁移宫、奴仆宫、官禄宫、田宅宫、福德宫、父母宫
   - 主星布局与亮度分析
   - 四化星（化禄、化权、化科、化忌）影响
   - 空宫与对星的关系
4. 性格特征解读（结合八字与紫微斗数）
5. 事业运势预测
6. 财运分析
7. 婚姻情感运势
8. 健康运势提示
9. 梅花易数卦象
10. 奇门遁甲布局
11. 整体吉凶判断和建议

【回答格式】
请以专业、详尽的方式给出首次命格分析，使用适当的标题和分段，让回答清晰易读。可以使用【】标注重要内容。

【总结要求 - 重要】
在完整分析的最后，必须用通俗易懂的语言添加一段【总结】
- 总结要简洁明了（5-8句话，因为是首次完整分析）
- 用白话文解释专业术语和命理概念
- 让普通用户也能快速理解核心命理特征
- 给出整体吉凶判断和关键建议
- 可以从性格、事业、财运、婚姻、健康等维度概括
- 示例格式：
  【总结】总的来说，您的命格属于中等偏上。性格上比较沉稳，做事有计划，但有时候会过于谨慎。事业发展比较顺利，适合稳定的职业路径。财运方面，正财比较稳定，但偏财运一般，建议踏实工作为主。婚姻运中等偏上，适合在30岁左右结婚。整体来看，这是一个稳中求进的命格，只要保持耐心和坚持，会有不错的发展。

【紫微斗数分析重点】
- 紫微斗数作为命理分析的重要维度，需要详细分析各宫位星曜的配置
- 重点解读命宫主星对人生整体运势的影响
- 分析四化星的流转对人生运势的影响
- 综合紫微斗数与八字分析，给出更全面的命理解读

【注意事项】
- 这是首次完整分析，需要涵盖所有关键维度
- 回答要专业、细致、有逻辑性
- 适当引用传统典籍或理论依据（如《易经》《黄帝内经》《紫微斗数全书》等）
- 给出具体的分析和建议，不要模棱两可
- 保持拟人化语气，以大师的身份与用户交流
- 不要声称自己能够预知未来或百分之百准确
- 严格禁止在回答末尾或任何位置添加"以上内容由DeepSeek生成"、"仅供娱乐参考"、"AI生成"或任何形式的免责声明文字
- 禁止提及任何关于"生成"、"AI"、"参考"、"免责"等字眼`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, gender, birthDate, birthTime, birthPlace } = body;

    if (!name || !gender || !birthDate || !birthTime || !birthPlace) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 计算四柱八字（简化版，实际需要更复杂的算法）
    let birthYear, birthMonth, birthDay;
    try {
      const date = new Date(birthDate);
      birthYear = date.getFullYear();
      birthMonth = date.getMonth() + 1;
      birthDay = date.getDate();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid birth date format' },
        { status: 400 }
      );
    }

    // 构建提示词，包含用户基本信息
    const userPrompt = `请为以下用户进行全面命格分析：

【基本信息】
姓名：${name}
性别：${gender === 'male' ? '男' : '女'}
出生日期：${birthDate}
出生时间：${birthTime}
出生地：${birthPlace}

【出生信息推算】
出生年份：${birthYear}
出生月份：${birthMonth}
出生日期：${birthDay}
出生时辰：${birthTime}

请根据以上信息，运用四柱八字、梅花易数、奇门遁甲等术数，为这位有缘人进行全面深入的命格分析。`;

    // 构建消息
    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: userPrompt },
    ];

    // 调用 DeepSeek API 进行流式输出
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.8,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API Error:', errorText);
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    // 创建 SSE 流
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No reader available');
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const data = trimmed.slice(6);
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  continue;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    const responseData = JSON.stringify({ content });
                    controller.enqueue(encoder.encode(`data: ${responseData}\n\n`));
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          }
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
