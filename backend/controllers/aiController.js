import axios from 'axios';
import productModel from '../models/productModel.js';
import productVariantModel from '../models/productVariantModel.js';
import productImageModel from '../models/productImageModel.js';
import categoryModel from '../models/categoryModel.js';

export const chatWithAI = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.json({ success: false, message: 'Lịch sử hội thoại không hợp lệ' });
    }

    const apiKey = process.env.AI_API_KEY || process.env.OPENROUTER_API_KEY;
    const baseUrl = process.env.AI_BASE_URL || 'https://openrouter.ai/api/v1';
    const modelName = process.env.AI_MODEL_NAME || 'google/gemma-3-12b-it';

    if (!apiKey) {
      return res.json({
        success: false,
        message: 'Chưa cấu hình AI_API_KEY hoặc OPENROUTER_API_KEY ở backend. Vui lòng kiểm tra lại file .env',
      });
    }

    // Fetch products
    const rawProducts = await productModel.find({}).lean();

    const productContextList = await Promise.all(
      rawProducts.map(async (p) => {
        const cat = await categoryModel.findById(p.categoryId).lean();
        const variants = await productVariantModel.find({ productId: p._id }).lean();
        const sizes = Array.from(new Set(variants.map((v) => v.size)));

        return {
          id: p._id.toString(),
          name: p.name,
          category: cat ? cat.name : 'Áo dài',
          price: p.price,
          sizes: sizes.length > 0 ? sizes : ['S', 'M', 'L'],
          description: p.description,
        };
      })
    );

    const systemPrompt = `Bạn là "Stylist Áo Dài ForHer" - chuyên gia tư vấn thời trang áo dài ngắn gọn, tinh tế.

Dưới đây là danh sách sản phẩm đang có tại cửa hàng:
${JSON.stringify(productContextList, null, 2)}

QUY TẮC BẮT BỘC VỀ PHONG CÁCH TRẢ LỜI:
1. TRẢ LỜI NGẮN GỌN & SÚC TÍCH: Chỉ trả lời tối đa từ 2 - 4 câu ngắn. Đi thẳng vào trọng tâm câu hỏi của khách hàng, tuyệt đối KHÔNG viết dài dòng, KHÔNG giải thích dông dài.
2. Lịch sự, tự nhiên, trình bày sạch đẹp với Markdown nhẹ nhàng (in đậm **tên sản phẩm/điểm nhấn**).
3. Chỉ gợi ý sản phẩm thực sự có trong danh sách trên. Không tự bịa ra sản phẩm.
4. Nêu nhanh 1 lý do nổi bật vì sao chọn và gợi ý ngắn màu quần/phụ kiện đi kèm.

CÚ PHÁP ĐỀ XUẤT SẢN PHẨM:
Ở cuối câu trả lời của bạn, bạn BẮT BUỘC phải đính kèm danh sách ID của các sản phẩm bạn đã đề xuất theo đúng cú pháp sau (không viết thêm gì sau phần này):
[RECOMMENDED_IDS: id1, id2]
`;

    const formattedMessages = messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: modelName,
        messages: [{ role: 'system', content: systemPrompt }, ...formattedMessages],
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'ForHer E-commerce',
          'Content-Type': 'application/json',
        },
      }
    );

    const replyContent = response.data.choices[0].message.content;

    let replyText = replyContent;
    let recommendedProductIds = [];

    const tagRegex = /\[RECOMMENDED_IDS:\s*([\s\S]*?)\]/;
    const match = replyText.match(tagRegex);
    if (match) {
      recommendedProductIds = match[1]
        .split(',')
        .map((id) => id.replace(/[\[\]"']/g, '').trim())
        .filter((id) => id.length > 0);

      replyText = replyText.replace(tagRegex, '').trim();
    }

    let recommendedProducts = [];
    if (recommendedProductIds.length > 0) {
      const recRaw = await productModel
        .find({ _id: { $in: recommendedProductIds } })
        .lean();

      recommendedProducts = await Promise.all(
        recRaw.map(async (p) => {
          const imgs = await productImageModel.find({ productId: p._id }).lean();
          return {
            ...p,
            image: imgs.map((i) => i.url),
          };
        })
      );
    }

    res.json({
      success: true,
      reply: replyText,
      recommendedProducts,
    });
  } catch (error) {
    console.error('Lỗi khi gọi API AI:', error.response?.data || error.message);
    res.json({
      success: false,
      message: 'Có lỗi xảy ra khi xử lý yêu cầu tư vấn AI: ' + (error.response?.data?.error?.message || error.message),
    });
  }
};
