import React from "react";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import NewsLetterBox from "../components/NewsLetterBox";

const About = () => {
  return (
    <div>
      <div className="text-center text-2xl pt-10 border-t">
        <Title text1={"GIỚI THIỆU"} text2={""} />
      </div>

      <div className="my-10 flex flex-col md:flex-row gap-16">
        <img
          className="w-full md:max-w-[450px]"
          src={assets.about}
          alt=""
        />
        <div className="flex flex-col justify-center gap-6 md:w-2/4 text-gray-600">
          <p>
            ForHer ra đời từ niềm đam mê đổi mới và mong muốn mang đến trải nghiệm
            mua sắm trực tuyến tiện lợi hơn. Chúng tôi bắt đầu với một ý tưởng đơn giản:
            tạo ra một nền tảng để khách hàng dễ dàng khám phá và mua sắm đa dạng sản phẩm
            ngay tại nhà.
          </p>
          <p>
            Từ những ngày đầu, chúng tôi luôn nỗ lực chọn lọc sản phẩm chất lượng,
            phù hợp nhiều nhu cầu và sở thích. Từ thời trang đến các sản phẩm thiết yếu,
            ForHer hướng đến việc cung cấp danh mục phong phú từ các nguồn uy tín.
          </p>
          <b className="text-gray-800">Sứ mệnh</b>
          <p>
            Sứ mệnh của ForHer là giúp khách hàng mua sắm với nhiều lựa chọn,
            thuận tiện và an tâm. Chúng tôi cam kết mang đến trải nghiệm trọn vẹn
            từ tìm kiếm, đặt hàng đến giao nhận. Mua sắm nên là điều dễ dàng, vui vẻ
            và phù hợp với mọi người.
          </p>
        </div>
      </div>

      <div className="text-xl py-4">
        <Title text1={"VÌ SAO"} text2={"CHỌN CHÚNG TÔI"} />
      </div>

      <div className="flex flex-col md:flex-row text-sm mb-20">
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Đảm bảo chất lượng:</b>
          <p className="text-gray-600">
            Chúng tôi lựa chọn và kiểm tra sản phẩm kỹ lưỡng để đáp ứng tiêu chuẩn
            chất lượng. Từ chất liệu đến hoàn thiện, mỗi sản phẩm đều được xem xét
            cẩn thận để bạn nhận được lựa chọn tốt nhất.
          </p>
        </div>
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Tiện lợi:</b>
          <p className="text-gray-600">
            Giao diện thân thiện và quy trình đặt hàng đơn giản giúp bạn mua sắm dễ dàng.
            Xem sản phẩm, so sánh giá và đặt hàng chỉ trong vài thao tác – mọi lúc, mọi nơi.
          </p>
        </div>
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Dịch vụ khách hàng:</b>
          <p className="text-gray-600">
            Đội ngũ hỗ trợ luôn sẵn sàng đồng hành cùng bạn. Từ tư vấn trước khi mua
            đến hỗ trợ sau mua, chúng tôi cố gắng phản hồi nhanh và hữu ích để bạn yên tâm.
          </p>
        </div>
      </div>

      <NewsLetterBox />
    </div>
  );
};

export default About;
