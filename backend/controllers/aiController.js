import axios from 'axios';
import productModel from '../models/productModel.js';

export const chatWithAI = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.json({ success: false, message: 'Lịch sử hội thoại không hợp lệ' });
    }

    const apiKey = process.env.AI_API_KEY || process.env.OPENROUTER_API_KEY;
    const baseUrl = process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1';
    const modelName = process.env.AI_MODEL_NAME || 'google/gemma-2-9b-it:free';

    if (!apiKey) {
      return res.json({ 
        success: false, 
        message: 'Chưa cấu hình AI_API_KEY hoặc OPENROUTER_API_KEY ở backend. Vui lòng kiểm tra lại file .env' 
      });
    }

    // 1. Lấy danh sách toàn bộ sản phẩm áo dài để làm context cho AI
    const allProducts = await productModel.find({}).lean();
    
    // Thu gọn thông tin sản phẩm để tối ưu tokens và tránh làm loãng ngữ cảnh
    const productContextList = allProducts.map(p => ({
      id: p._id.toString(),
      name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      price: p.price,
      sizes: p.sizes,
      description: p.description
    }));

    // 2. Chuẩn bị prompt hệ thống
    const systemPrompt = `Bạn là "Stylist Áo Dài ForHer" - chuyên gia tư vấn thời trang áo dài hàng đầu tại Việt Nam.
Nhiệm vụ của bạn là tư vấn cho khách hàng chọn áo dài phù hợp với dáng người, màu da, sở thích và đặc biệt là phù hợp với dịp lễ (như Tết, đám cưới, lễ tốt nghiệp, chụp ảnh sen, đi tiệc, đi chùa...).

Dưới đây là danh sách toàn bộ sản phẩm áo dài đang có trong cửa hàng:
${JSON.stringify(productContextList, null, 2)}

Nguyên tắc tư vấn:
1. Luôn lịch sự, thân thiện, xưng hô phù hợp (ví dụ: tư vấn cho bạn, dạ, vâng...).
2. Trả lời bằng tiếng Việt tự nhiên, có cấu trúc rõ ràng. Hãy sử dụng định dạng Markdown (như in đậm **, danh sách gạch đầu dòng, xuống dòng) để câu trả lời sinh động, dễ đọc.
3. Khi khách hàng hỏi hoặc mô tả nhu cầu, hãy giải thích cặn kẽ và đề xuất các sản phẩm phù hợp dựa trên danh sách sản phẩm trên.
4. Chỉ gợi ý những sản phẩm thực sự có trong danh sách trên. Không tự bịa ra sản phẩm.
5. Đối với mỗi sản phẩm gợi ý, hãy nêu rõ lý do tại sao nó phù hợp (về chất liệu như lụa gấm sang trọng, tơ ống bay bổng, chéo Hàn co giãn thoải mái, hay kiểu dáng thêu/đính kết lộng lẫy).
6. Hãy đề xuất thêm cách phối màu sắc quần lụa mặc kèm hoặc mấn phù hợp với chiếc áo đó để tạo thành set đồ hoàn hảo.

CÚ PHÁP ĐỀ XUẤT SẢN PHẨM:
Ở cuối câu trả lời của bạn, bạn BẮT BUỘC phải đính kèm danh sách ID của các sản phẩm bạn đã đề xuất theo đúng cú pháp sau (không viết thêm gì sau phần này):
[RECOMMENDED_IDS: id1, id2]

Ví dụ cuối câu trả lời:
... Do đó, chiếc áo dài này sẽ giúp chị trông thật thanh lịch và duyên dáng.
[RECOMMENDED_IDS: 66827e857cdb4e056c601f01, 66827e857cdb4e056c601f02]
`;

    // Định dạng lịch sử chat thành định dạng OpenAI/OpenRouter
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    }));

    // Gọi API qua Proxy (9Router / OpenRouter)
    // Loại bỏ response_format: json_object để model trả về văn bản tự nhiên, tránh lỗi escaping dấu ngoặc kép / ký tự đặc biệt
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          ...formattedMessages
        ],
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'ForHer E-commerce',
          'Content-Type': 'application/json'
        }
      }
    );

    const replyContent = response.data.choices[0].message.content;
    console.log('🤖 ~ chatWithAI ~ replyContent:', replyContent);

    let replyText = replyContent;
    let recommendedProductIds = [];

    // Trích xuất danh sách ID sản phẩm từ cú pháp đặc biệt bằng Regex
    const tagRegex = /\[RECOMMENDED_IDS:\s*([\s\S]*?)\]/;
    const match = replyText.match(tagRegex);
    if (match) {
      recommendedProductIds = match[1]
        .split(',')
        .map(id => id.replace(/[\[\]"']/g, '').trim())
        .filter(id => id.length > 0);
      
      // Xóa phần tag [RECOMMENDED_IDS: ...] khỏi câu trả lời hiển thị cho khách hàng
      replyText = replyText.replace(tagRegex, '').trim();
    }

    // Lấy thông tin chi tiết của các sản phẩm được đề xuất từ MongoDB
    let recommendedProducts = [];
    if (recommendedProductIds.length > 0) {
      recommendedProducts = await productModel.find({
        _id: { $in: recommendedProductIds }
      }).lean();
    }

    res.json({
      success: true,
      reply: replyText,
      recommendedProducts: recommendedProducts
    });

  } catch (error) {
    console.error('Lỗi khi gọi API:', error.response?.data || error.message);
    res.json({ 
      success: false, 
      message: 'Có lỗi xảy ra khi xử lý yêu cầu tư vấn AI: ' + (error.response?.data?.error?.message || error.message)
    });
  }
};
