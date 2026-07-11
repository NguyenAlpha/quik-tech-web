"use client"

import { Crown, User } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useLanguage } from "@/lib/language-context"

const faqData = {
  en: [
    {
      id: "subscription",
      category: "Subscription",
      Icon: Crown,
      items: [
        {
          q: "How do I upgrade my plan?",
          a: "Go to the Subscription page from the left sidebar. Choose the plan you want, select your billing cycle (monthly or yearly), then click Upgrade. The system will display bank transfer details and a transfer reference code for you to complete the payment.",
        },
        {
          q: "What is the transfer reference?",
          a: 'When you create an upgrade request, the system automatically generates a transfer reference like "basic 5" or "pro 12" (plan name + order number). Just copy it and paste it into the transfer description field — no need to type anything else.',
        },
        {
          q: "How long does it take for the plan to activate after payment?",
          a: "Our team reviews and confirms payments within 1 business day. Once confirmed, your plan activates immediately and you will receive an email notification.",
        },
        {
          q: "What if my payment is rejected?",
          a: "You will receive an email with the reason for rejection. Check the transferred amount and transfer reference, then create a new upgrade request to try again.",
        },
        {
          q: "How do I downgrade my plan?",
          a: "Go to the Subscription page and click Downgrade Plan. Select the plan you want to switch to. The downgrade takes effect at the end of your current billing cycle — you continue on your current plan until then.",
        },
        {
          q: "Is there a refund when downgrading or cancelling?",
          a: "No. We do not offer refunds for the remaining time in a billing cycle. Your plan continues until the end of the current period.",
        },
        {
          q: "Will my data be deleted when I downgrade?",
          a: "No data is deleted. Existing records are kept, but once the downgrade takes effect you will be blocked from creating new items that exceed the new plan's limits (for example, adding more products than the limit allows).",
        },
        {
          q: "How do I cancel a scheduled downgrade?",
          a: "If you have scheduled a downgrade but want to keep your current plan, go to the Subscription page and click Cancel Downgrade. Your subscription will continue as normal.",
        },
        {
          q: "What are the FREE plan limits?",
          a: "The FREE plan includes: 1 store, 0 staff accounts, 50 products, and 1 warehouse. Upgrade to BASIC or PRO to increase these limits.",
        },
      ],
    },
    {
      id: "account",
      category: "Account",
      Icon: User,
      items: [
        {
          q: "How do I change my password?",
          a: "Password changes are not yet supported directly in the app. Please contact support for assistance.",
        },
        {
          q: "Can I manage multiple stores?",
          a: "Yes, depending on your plan: BASIC supports 2 stores, PRO supports 3 stores. The FREE plan is limited to 1 store.",
        },
        {
          q: "Who can manage the subscription?",
          a: "Only the business Owner can upgrade, downgrade, or manage billing. Staff members can view the current plan but cannot make changes.",
        },
      ],
    },
  ],
  vi: [
    {
      id: "subscription",
      category: "Gói đăng ký",
      Icon: Crown,
      items: [
        {
          q: "Làm thế nào để nâng cấp gói?",
          a: "Vào trang Gói dịch vụ từ menu bên trái. Chọn gói muốn nâng cấp, chọn chu kỳ thanh toán (tháng hoặc năm), sau đó nhấn Nâng cấp. Hệ thống sẽ hiển thị thông tin tài khoản ngân hàng và nội dung chuyển khoản để bạn thực hiện thanh toán.",
        },
        {
          q: "Nội dung chuyển khoản là gì?",
          a: 'Khi tạo yêu cầu nâng cấp, hệ thống tự động tạo nội dung chuyển khoản dạng "basic 5" hoặc "pro 12" (tên gói + số thứ tự đơn). Bạn chỉ cần copy và dán vào phần nội dung khi chuyển khoản — không cần nhập thêm gì khác.',
        },
        {
          q: "Sau khi chuyển khoản thì bao lâu gói được kích hoạt?",
          a: "Đội ngũ hỗ trợ sẽ kiểm tra và xác nhận trong vòng 1 ngày làm việc. Sau khi xác nhận, gói sẽ được kích hoạt ngay và bạn sẽ nhận email thông báo.",
        },
        {
          q: "Nếu thanh toán bị từ chối thì phải làm gì?",
          a: "Bạn sẽ nhận email thông báo kèm lý do từ chối. Hãy kiểm tra lại số tiền và nội dung chuyển khoản, sau đó tạo yêu cầu nâng cấp mới để thực hiện lại.",
        },
        {
          q: "Làm thế nào để hạ cấp gói?",
          a: "Vào trang Gói dịch vụ và nhấn Hạ cấp gói. Chọn gói muốn chuyển về. Hạ cấp sẽ có hiệu lực vào cuối chu kỳ thanh toán hiện tại — trong thời gian chờ, bạn vẫn dùng gói hiện tại.",
        },
        {
          q: "Có được hoàn tiền khi hạ cấp hoặc hủy gói không?",
          a: "Không. Chúng tôi không hoàn tiền cho thời gian còn lại của chu kỳ. Gói sẽ tiếp tục đến hết chu kỳ hiện tại.",
        },
        {
          q: "Dữ liệu có bị xóa khi hạ cấp không?",
          a: "Dữ liệu không bị xóa. Dữ liệu hiện có được giữ nguyên, nhưng sau khi hạ cấp có hiệu lực, bạn sẽ không thể tạo thêm mục mới vượt giới hạn của gói mới (ví dụ: thêm sản phẩm khi đã đạt giới hạn).",
        },
        {
          q: "Làm thế nào để hủy lịch hạ cấp?",
          a: "Nếu đã đặt lịch hạ cấp nhưng muốn giữ gói hiện tại, vào trang Gói dịch vụ và nhấn Hủy lịch hạ cấp. Gói đăng ký sẽ tiếp tục bình thường.",
        },
        {
          q: "Gói FREE có những giới hạn gì?",
          a: "Gói FREE bao gồm: 1 cửa hàng, 0 tài khoản nhân viên, 50 sản phẩm và 1 kho hàng. Nâng lên gói BASIC hoặc PRO để tăng các giới hạn này.",
        },
      ],
    },
    {
      id: "account",
      category: "Tài khoản",
      Icon: User,
      items: [
        {
          q: "Làm thế nào để đổi mật khẩu?",
          a: "Hiện tại chưa hỗ trợ đổi mật khẩu trực tiếp từ app. Vui lòng liên hệ hỗ trợ để được hỗ trợ.",
        },
        {
          q: "Tôi có thể quản lý nhiều cửa hàng không?",
          a: "Có, tùy theo gói đăng ký: BASIC hỗ trợ 2 cửa hàng, PRO hỗ trợ 3 cửa hàng. Gói FREE giới hạn 1 cửa hàng.",
        },
        {
          q: "Ai có thể quản lý gói đăng ký?",
          a: "Chỉ Owner của business mới có thể nâng cấp, hạ cấp hoặc quản lý thanh toán. Nhân viên chỉ có thể xem gói hiện tại, không thể thực hiện thay đổi.",
        },
      ],
    },
  ],
}

export default function HelpPage() {
  const { t, language } = useLanguage()
  const categories = faqData[language] ?? faqData.vi

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-bold">{t.help.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.help.subtitle}</p>
      </div>

      {categories.map((cat) => (
        <div key={cat.id}>
          <div className="mb-3 flex items-center gap-2">
            <cat.Icon className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {cat.category}
            </h2>
          </div>
          <Accordion type="single" collapsible className="space-y-1">
            {cat.items.map((item, i) => (
              <AccordionItem
                key={i}
                value={`${cat.id}-${i}`}
                className="rounded-lg border px-4"
              >
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}
    </div>
  )
}
