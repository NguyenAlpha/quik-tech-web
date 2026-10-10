'use client'

import { useLanguage } from '@/lib/language-context'

const copy = {
  en: {
    title: 'API traffic', description: 'Request volume, errors and response times of the API, plus the current health of the server.',
    range: 'Time range', range1h: 'Last hour', range24h: 'Last 24 hours', range7d: 'Last 7 days', range30d: 'Last 30 days',
    autoRefresh: 'Refreshes every 30 seconds', delayNote: 'Statistics are written once a minute, so the latest 1–2 minutes may be missing.',
    requests: 'Requests', perMinute: '{value} / min on average', serverErrors: 'Server errors (5xx)', clientErrors: 'Client errors (4xx)',
    rateLimited: 'Rate limited (429)', errorRate: '{value} of requests', latency: 'Response time',
    latencySub: 'p50 {p50} · p99 {p99} · max {max}', avg: 'Average', p95: 'p95',
    volumeTitle: 'Requests over time', volumeDescription: 'Successful requests, client errors and server errors per interval.',
    success: 'Successful', latencyTitle: 'p95 response time', latencyDescription: '95% of requests finished within this time (estimated).',
    statusTitle: 'Status codes', statusDescription: 'Responses grouped by HTTP status.',
    endpointsTitle: 'Endpoints', endpointsDescription: 'Top 50 endpoints by request count in the selected range.',
    sortRequests: 'Most requests', sortLatency: 'Slowest', sortErrors: 'Most errors',
    endpoint: 'Endpoint', max: 'Max', unmatched: 'Rejected before reaching an endpoint (401, 429, 404…)',
    businessesTitle: 'Usage by business', businessesDescription: 'Businesses with the most requests (top 20). Admin requests are excluded.',
    business: 'Business', share: 'Share',
    noData: 'No requests recorded in this range yet.',
    systemTitle: 'System health', systemDescription: 'Live values of the API instance that answered this request — no history.',
    overall: 'Overall', uptime: 'Uptime', memory: 'Heap memory', cpu: 'CPU', processCpu: 'Process {value}', systemCpu: 'Machine {value}',
    threads: 'Threads', dbPool: 'Database connections', dbPoolSub: '{active} active · {idle} idle · max {max}', dbPending: '{value} waiting for a connection',
    unavailable: 'Not available', checkedAt: 'Checked at {time}', up: 'Up', down: 'Down',
    loadError: 'Could not load traffic statistics.', systemError: 'Could not load system health.',
  },
  vi: {
    title: 'Lưu lượng API', description: 'Số request, lỗi và thời gian phản hồi của API, cùng tình trạng hiện tại của máy chủ.',
    range: 'Khoảng thời gian', range1h: '1 giờ qua', range24h: '24 giờ qua', range7d: '7 ngày qua', range30d: '30 ngày qua',
    autoRefresh: 'Tự làm mới mỗi 30 giây', delayNote: 'Số liệu được ghi mỗi phút một lần nên 1–2 phút gần nhất có thể chưa có.',
    requests: 'Request', perMinute: 'Trung bình {value} / phút', serverErrors: 'Lỗi máy chủ (5xx)', clientErrors: 'Lỗi phía client (4xx)',
    rateLimited: 'Bị giới hạn (429)', errorRate: '{value} số request', latency: 'Thời gian phản hồi',
    latencySub: 'p50 {p50} · p99 {p99} · tối đa {max}', avg: 'Trung bình', p95: 'p95',
    volumeTitle: 'Request theo thời gian', volumeDescription: 'Request thành công, lỗi client và lỗi máy chủ theo từng khoảng.',
    success: 'Thành công', latencyTitle: 'Thời gian phản hồi p95', latencyDescription: '95% request hoàn tất trong thời gian này (ước lượng).',
    statusTitle: 'Mã trạng thái', statusDescription: 'Response gom theo mã HTTP.',
    endpointsTitle: 'Endpoint', endpointsDescription: '50 endpoint nhiều request nhất trong khoảng thời gian đã chọn.',
    sortRequests: 'Nhiều request nhất', sortLatency: 'Chậm nhất', sortErrors: 'Lỗi nhiều nhất',
    endpoint: 'Endpoint', max: 'Tối đa', unmatched: 'Bị chặn trước khi tới endpoint (401, 429, 404…)',
    businessesTitle: 'Mức dùng theo doanh nghiệp', businessesDescription: '20 doanh nghiệp gọi nhiều request nhất. Không tính request của admin.',
    business: 'Doanh nghiệp', share: 'Tỉ lệ',
    noData: 'Chưa có request nào trong khoảng thời gian này.',
    systemTitle: 'Tình trạng hệ thống', systemDescription: 'Giá trị tức thời của instance API đã trả lời request này — không có lịch sử.',
    overall: 'Tổng thể', uptime: 'Thời gian chạy', memory: 'Bộ nhớ heap', cpu: 'CPU', processCpu: 'Tiến trình {value}', systemCpu: 'Máy chủ {value}',
    threads: 'Luồng', dbPool: 'Kết nối database', dbPoolSub: '{active} đang dùng · {idle} rảnh · tối đa {max}', dbPending: '{value} đang chờ kết nối',
    unavailable: 'Không có dữ liệu', checkedAt: 'Đo lúc {time}', up: 'Hoạt động', down: 'Lỗi',
    loadError: 'Không tải được thống kê lưu lượng.', systemError: 'Không tải được tình trạng hệ thống.',
  },
}

export function useTrafficCopy() {
  const { language } = useLanguage()
  return copy[language]
}
