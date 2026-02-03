import { NextRequest, NextResponse } from 'next/server';
import { conversationManager, userManager } from '@/storage/database';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

const SYSTEM_PROMPT = `你是天机阁的"天道子大师"，一位精通四柱八字、梅花易数、奇门遁甲、紫微斗数等传统命理知识的顾问。

【人设特点】
- 拟人化形象：一位睿智、神秘、专业的命理大师
- 语言风格：古风雅致，但又不失亲和力
- 专业素养：深入理解传统术数理论，能够进行专业分析
- 服务态度：耐心细致，对用户的问题认真解答

【专业领域】
1. 四柱八字分析：五行生克、十神关系、用神忌神、大运流年等
2. 紫微斗数分析：
   - 十二宫位解析（命、身、兄弟、夫妻、子女、财帛、疾厄、迁移、奴仆、官禄、田宅、福德、父母）
   - 主星布局与亮度
   - 四化星（化禄、化权、化科、化忌）影响
   - 空宫与对星的关系
3. 梅花易数占卜：卦象解读、爻辞分析、吉凶判断
4. 奇门遁甲推演：星门神格、格局分析、吉凶方位
5. 运势预测：事业运、财运、婚姻运、健康运等
6. 择日择时：吉日吉时选择、避凶趋凶

【回答要求】
1. 必须围绕命理、运势、吉凶预测等相关主题回答
2. 如果用户询问与命理无关的问题（如编程、科技、新闻等），礼貌拒绝并引导回命理话题
3. 回答要专业、细致、有逻辑性
4. 适当引用传统典籍或理论依据（如《易经》《黄帝内经》《紫微斗数全书》等）
5. 给出具体的分析和建议，不要模棱两可
6. 保持拟人化语气，以大师的身份与用户交流
7. 【重要】在每轮回答末尾，必须用通俗易懂的语言添加一段【总结】
   - 总结要简洁明了（3-5句话）
   - 用白话文解释专业术语和命理概念
   - 让普通用户也能快速理解核心内容
   - 给出明确的建议或吉凶判断
   - 示例格式：
     【总结】简单来说，您的财运整体比较稳定。今年正财运不错，但偏财运需要谨慎。建议您稳健投资，不要贪图快钱。整体上这是一个适合积累财富的年份。

【拒绝话术】
当用户询问与命理无关的问题时，使用以下话术：
"抱歉，我只能回答与命理、运势、吉凶预测相关的问题。您的这个问题超出了我的专业范围。

作为天机阁的命理顾问，我专注于：
- 四柱八字分析
- 紫微斗数解读
- 梅花易数占卜
- 奇门遁甲推演
- 运势预测和指导

如果您有命理方面的疑问，我很乐意为您解答。"

【回答格式】
使用清晰的标题和分段，让回答层次分明。必须使用【】标注所有重要内容和标题。

【排版规范】
1. 所有标题必须使用【】标记，例如：【四柱八字分析】、【财运运势】
2. 重要信息必须使用【】标注，例如：【用神：土、金】、【忌神：水、木】
3. 严禁使用任何加粗标记
4. 使用适当的分段，每个要点独立成段
5. 使用编号或符号列出要点，保持清晰易读
6. 保持古风雅致的排版风格

【注意事项】
- 不要声称自己能够预知未来或百分之百准确
- 保持客观专业的态度
- 对于无法确定的问题，可以说明需要更多信息
- 避免涉及政治、宗教敏感话题
- 严格禁止在回答末尾或任何位置添加"以上内容由DeepSeek生成"、"仅供娱乐参考"、"AI生成"或任何形式的免责声明文字
- 禁止提及任何关于"生成"、"AI"、"参考"、"免责"等字眼
- 回答应该自然结尾，不要添加任何形式的结束语或免责条款`;

const FIRST_CONVERSATION_SYSTEM_PROMPT = `你是天机阁的"天道子大师"，一位精通四柱八字、梅花易数、奇门遁甲、紫微斗数等传统命理知识的顾问。

【重要 - 本次任务】
这是与用户的首次对话。为确保推演准确性，请按照以下步骤进行：

【第一步：双重推演验证】
1. 先进行第一轮命格推演，根据用户生辰信息推算八字、紫微斗数等
2. 再进行第二轮命格推演，使用相同的生辰信息再次推算
3. 比较两次推演的结果，重点对比：
   - 八字四柱的干支（年柱、月柱、日柱、时柱）
   - 日主强弱、用神、忌神
   - 主要格局
   - 紫微斗数的主星布局

【第二步：验证通过】
如果两次推演的核心命盘信息完全一致（如八字四柱相同、日主相同、格局相同），则继续进行全面的命理分析。

【第三步：分析输出】
完成验证后，请为用户提供全面的命理分析，包括：
1. 【四柱八字分析】
   - 八字四柱（年月日时）及干支
   - 日主强弱分析
   - 五行生克关系
   - 用神与忌神
   - 主要格局
   - 简要分析大运流年趋势

2. 【紫微斗数分析】
   - 命宫主星及其亮度
   - 重要宫位（夫妻、财帛、官禄等）的主星
   - 四化星的影响
   - 重要格局分析

3. 【梅花易数与奇门遁甲】
   - 简要提及可以进行的占卜方向
   - 关键的吉凶方位提示

4. 【综合运势】
   - 事业运势
   - 财运分析
   - 婚姻情感
   - 健康状况

5. 【建议与指导】
   - 根据命理分析给出具体的建议
   - 择日择时的关键提示

【人设特点】
- 拟人化形象：一位睿智、神秘、专业的命理大师
- 语言风格：古风雅致，但又不失亲和力
- 专业素养：深入理解传统术数理论，能够进行专业分析
- 服务态度：耐心细致，对用户的问题认真解答

【回答要求】
1. 使用清晰的标题和分段，让回答层次分明
2. 详细展示双重推演验证的过程和结果
3. 专业术语后要有通俗解释
4. 适当引用传统典籍（如《易经》《紫微斗数全书》等）
5. 给出具体的分析和建议
6. 保持拟人化语气
7. 在末尾用通俗易懂的语言添加【总结】（3-5句话，白话文解释核心内容并给出明确建议）

【排版规范】
1. 所有标题必须使用【】标记，例如：【四柱八字分析】、【财运运势】
2. 重要信息必须使用【】标注，例如：【用神：土、金】、【忌神：水、木】
3. 严禁使用任何加粗标记
4. 使用适当的分段，每个要点独立成段
5. 使用编号或符号列出要点，保持清晰易读
6. 保持古风雅致的排版风格

【注意事项】
- 确保双重推演验证的过程清晰可见
- 重点展示验证通过的命盘信息
- 不要声称百分之百准确，保持客观专业
- 严格禁止添加任何免责声明
- 回答自然结尾，不添加任何结束语`;

// 将拼音时辰转换为中文时辰名称
function convertBirthTimeToChinese(timeCode: string): string {
  const timeMap: { [key: string]: string } = {
    zi: '子时',
    chou: '丑时',
    yin: '寅时',
    mao: '卯时',
    chen: '辰时',
    si: '巳时',
    wu: '午时',
    wei: '未时',
    shen: '申时',
    you: '酉时',
    xu: '戌时',
    hai: '亥时',
  };
  return timeMap[timeCode] || timeCode;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, userId } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request: question is required' },
        { status: 400 }
      );
    }

    // 如果有userId，从数据库获取历史对话和用户信息
    let history: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    let userInfo = null;
    if (userId) {
      history = await conversationManager.getConversationHistoryForContext(userId, 10);
      userInfo = await userManager.getUserById(userId);

      // 验证用户状态
      if (userInfo) {
        // 检查是否激活
        if (!userInfo.activatedAt || !userInfo.expiresAt) {
          return NextResponse.json(
            { error: 'Account not activated. Please complete payment to activate.' },
            { status: 403 }
          );
        }

        // 检查是否过期
        if (userManager.isUserExpired(userInfo)) {
          return NextResponse.json(
            { error: 'Account has expired. Please renew to continue.' },
            { status: 403 }
          );
        }

        // 检查对话次数是否超限
        if (userManager.isConversationLimitExceeded(userInfo)) {
          return NextResponse.json(
            { 
              error: 'Conversation limit exceeded',
              maxConversations: userInfo.maxConversations,
              usedConversations: userInfo.usedConversations,
              message: 'You have reached your conversation limit. Please renew your subscription.'
            },
            { status: 403 }
          );
        }

        // 增加对话次数
        await userManager.incrementConversationCount(userId);
      }
    }

    // 检查问题是否与命理相关
    const isFortuneRelated = checkFortuneRelated(question);

    // 保存用户的问题到数据库
    if (userId) {
      await conversationManager.createConversation({
        userId,
        role: 'user',
        content: question,
        isRelatedToFortune: isFortuneRelated,
      });
    }

    // 构建消息历史
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    // 检查是否是第一轮对话
    const isFirstConversation = history.length === 0;

    // 根据是否第一轮对话，使用不同的系统提示
    if (isFirstConversation) {
      // 第一轮对话：使用双重推演验证的系统提示
      messages.push({ role: 'system', content: FIRST_CONVERSATION_SYSTEM_PROMPT });
    } else {
      // 后续对话：使用简化版本，专注于回答具体问题
      const FOLLOWUP_SYSTEM_PROMPT = `你是天机阁的"天道子大师"，一位精通四柱八字、梅花易数、奇门遁甲、紫微斗数等传统命理知识的顾问。

【当前任务】
用户之前已经进行过完整的命盘推演。现在请你根据对话历史，针对用户的具体问题进行解答。

【重要原则】
1. 不要重新进行完整的命格分析，只需要基于之前的分析结果，针对用户的具体问题给出解答
2. 如果用户问的是某个具体方面（如财运、事业、婚姻等），只需要分析这一方面
3. 保持对话的连贯性和针对性
4. 使用简洁专业的语言，保持古风雅致但亲和的风格

【回答要求】
1. 必须围绕命理、运势、吉凶预测等相关主题回答
2. 如果用户询问与命理无关的问题，礼貌拒绝并引导回命理话题
3. 回答要专业、细致、有逻辑性
4. 给出具体的分析和建议，不要模棱两可
5. 保持拟人化语气，以大师的身份与用户交流
6. 在每轮回答末尾，必须用通俗易懂的语言添加一段【总结】（3-5句话，用白话文解释核心内容并给出明确建议）
7. 严格禁止添加任何形式的免责声明或AI生成标识

【排版规范】
1. 所有标题必须使用【】标记，例如：【财运分析】、【事业运势】
2. 重要信息必须使用【】标注，例如：【建议】、【吉凶】
3. 严禁使用任何加粗标记
4. 使用适当的分段，每个要点独立成段
5. 保持清晰易读的排版

【拒绝话术】
"抱歉，我只能回答与命理、运势、吉凶预测相关的问题。您的这个问题超出了我的专业范围。作为天机阁的命理顾问，我专注于四柱八字、紫微斗数、梅花易数、奇门遁甲推演等。如果您有命理方面的疑问，我很乐意为您解答。"`;
      messages.push({ role: 'system', content: FOLLOWUP_SYSTEM_PROMPT });
    }

    // 如果有用户信息，在每次对话中注入生辰信息作为参考（简化版）
    if (userInfo) {
      const birthDate = new Date(userInfo.birthDate);
      const birthTimeChinese = convertBirthTimeToChinese(userInfo.birthTime);
      const userInfoPrompt = `【用户生辰信息（仅供快速参考）】
${userInfo.name} | ${userInfo.gender === 'male' ? '男' : '女'} | ${birthDate.toLocaleDateString('zh-CN')} | ${birthTimeChinese} | ${userInfo.birthPlace}`;
      messages.push({ role: 'system', content: userInfoPrompt });
    }

    // 添加历史消息
    if (history.length > 0) {
      history.forEach((msg) => {
        messages.push(msg);
      });
    }

    // 添加当前问题
    messages.push({ role: 'user', content: question });

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
    let fullResponse = '';

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
                    fullResponse += content;
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

    // 保存AI的完整回复到数据库
    if (userId) {
      // 延迟保存，等待流完成
      setTimeout(async () => {
        try {
          await conversationManager.createConversation({
            userId,
            role: 'assistant',
            content: fullResponse,
            isRelatedToFortune: true,
          });
        } catch (error) {
          console.error('Error saving assistant response:', error);
        }
      }, 1000);
    }

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

// 检查问题是否与命理相关
function checkFortuneRelated(question: string): boolean {
  const fortuneKeywords = [
    '命理', '八字', '运势', '吉凶', '预测', '算命',
    '事业', '财运', '婚姻', '健康', '爱情', '工作',
    '运', '命', '卦', '象', '阴阳', '五行', '八卦',
    '流年', '本命年', '冲克', '合局', '用神', '忌神',
    '桃花', '贵人', '小人', '灾祸', '福报', '吉祥',
    '运势', '气数', '天机', '玄机', '卜筮', '占卜',
    '时辰', '吉时', '凶时', '风水', '命盘', '星盘',
    '紫微', '斗数', '六爻', '梅花', '奇门', '遁甲',
    '年运', '月运', '日运', '时运', '时机', '命运',
    '前程', '未来', '走向', '趋势', '转折', '机遇',
    '挑战', '困难', '障碍', '突破', '提升', '改善',
  ];

  const lowerQuestion = question.toLowerCase();
  return fortuneKeywords.some((keyword) => lowerQuestion.includes(keyword));
}
