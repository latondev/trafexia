export type Locale = "en" | "vi" | "zh" | "ja" | "ko" | "es" | "fr" | "de" | "ru" | "pt";

export const translations = {
  en: {
    nav: {
      features: "Features",
      docs: "Docs",
      download: "Download",
      stars: "GitHub",
      cta: "Download Free"
    },
    hero: {
      tag: "MOBILE TRAFFIC INTERCEPTOR",
      badge: "INTERCEPTED",
      headline: "Intercept. Decode. Reverse.",
      subtitle: "MITM proxy for Android and iOS. Capture HTTPS traffic, analyze APIs, detect patterns — right on your desktop.",
      cta_mac: "Download for macOS",
      cta_github: "View on GitHub",
      stars: "GitHub Stars",
      forks: "Forks",
      release: "Latest Release",
      license: "License"
    },
    features: {
      tag: "FEATURES",
      title: "Maximum Analytical Power",
      subtitle: "All the professional tools you need to intercept, analyze, and reverse engineer mobile applications.",
      mitm_title: "MITM Proxy",
      mitm_desc: "Intercept HTTP/HTTPS traffic on port 8888. Automatically generate and manage secure local CA certificates.",
      qr_title: "QR Setup",
      qr_desc: "Quickly configure proxy settings on your mobile device (Android & iOS) simply by scanning a QR code.",
      pattern_title: "Pattern Detection",
      pattern_desc: "Automatically detect and decode JWTs, API keys, Base64 strings, and Bearer tokens inside HTTP payloads.",
      capture_title: "Real-time Capture",
      capture_desc: "Watch live network traffic flow in real-time with ultra-low latency and highly optimized streaming.",
      filter_title: "Advanced Filter",
      filter_desc: "Powerful regex-based filtering by HTTP method, status code, hostname, or content-type headers.",
      export_title: "Export Suite",
      export_desc: "Export captured requests as HAR files, cURL commands, Python requests scripts, or Postman collections."
    },
    howItWorks: {
      tag: "WORKFLOW",
      title: "Simple Operation",
      subtitle: "No complex networking knowledge required. Three simple steps to intercept all mobile traffic.",
      step1_title: "Start Proxy",
      step1_desc: "Launch the proxy server inside the Trafexia Desktop app with a single click.",
      step2_title: "Scan QR",
      step2_desc: "Scan the configuration QR code with your mobile camera to auto-setup the proxy and certificate.",
      step3_title: "Capture Traffic",
      step3_desc: "Instantly capture, inspect, and analyze all HTTP/HTTPS requests on your desktop app."
    },
    techStack: {
      tag: "COMPATIBILITY",
      title: "Supported Technologies",
      subtitle: "Works seamlessly with popular mobile frameworks, native platforms, and API servers."
    },
    download: {
      tag: "DOWNLOAD",
      title: "Get Trafexia",
      subtitle: "Available for macOS, Windows, and Linux. Choose the version matching your development environment.",
      macos_pkg: ".dmg package",
      macos_archs: "Universal (Intel & Apple Silicon)",
      windows_pkg: ".exe installer",
      windows_archs: "x64 Architecture",
      linux_pkg: ".AppImage bundle",
      linux_archs: "x64 / arm64",
      cta: "Download Free",
      warning_title: "SECURITY WARNING",
      warning_desc: "This application generates a self-signed Root CA certificate to decrypt HTTPS traffic (MITM Proxy). You should only install this CA certificate and inspect network traffic on personal or authorized testing devices. Never install the CA certificate on production devices containing sensitive personal data. Uninstall the certificate when debugging is finished."
    },
    footer: {
      copyright: "All rights reserved.",
      docs: "Docs",
      github: "GitHub",
      releases: "Releases",
      license: "License"
    }
  },
  vi: {
    nav: {
      features: "Tính năng",
      docs: "Tài liệu",
      download: "Tải về",
      stars: "GitHub",
      cta: "Tải miễn phí"
    },
    hero: {
      tag: "MOBILE TRAFFIC INTERCEPTOR",
      badge: "ĐÃ CHẶN ĐỨNG",
      headline: "Intercept. Decode. Reverse.",
      subtitle: "MITM proxy cho Android và iOS. Capture HTTPS traffic, phân tích API, detect patterns — ngay trên desktop.",
      cta_mac: "Tải cho macOS",
      cta_github: "Xem trên GitHub",
      stars: "GitHub Stars",
      forks: "Forks",
      release: "Bản mới nhất",
      license: "Giấy phép"
    },
    features: {
      tag: "TÍNH NĂNG",
      title: "Sức mạnh phân tích tối đa",
      subtitle: "Tất cả các công cụ chuyên nghiệp cần có để giải mã và đảo ngược kỹ thuật (reverse engineer) ứng dụng di động.",
      mitm_title: "MITM Proxy",
      mitm_desc: "Chặn đứng lưu lượng HTTP/HTTPS trên port 8888. Tự động sinh và quản lý Certificate Authority (CA) certificates an toàn.",
      qr_title: "QR Setup",
      qr_desc: "Cấu hình proxy nhanh chóng trên điện thoại di động (Android & iOS) chỉ bằng cách quét mã QR từ giao diện máy tính.",
      pattern_title: "Pattern Detection",
      pattern_desc: "Tự động phát hiện và giải mã JWT, API keys, mã hóa Base64, Bearer tokens và các thông tin nhạy cảm trong HTTP payloads.",
      capture_title: "Real-time Capture",
      capture_desc: "Xem trực tiếp luồng traffic mạng di động cuộn theo thời gian thực với độ trễ cực thấp và hiệu năng xử lý luồng cao.",
      filter_title: "Advanced Filter",
      filter_desc: "Lọc và tìm kiếm traffic mạnh mẽ bằng Regular Expressions theo HTTP Methods, Status Codes, Hosts hoặc Content-Types.",
      export_title: "Export Suite",
      export_desc: "Xuất dữ liệu yêu cầu dưới dạng các định dạng phổ biến: HAR file, cURL command, Python requests script, Postman collection."
    },
    howItWorks: {
      tag: "QUY TRÌNH",
      title: "Hoạt động đơn giản",
      subtitle: "Không cần kiến thức mạng phức tạp. Ba bước đơn giản để cấu hình và chặn đứng lưu lượng.",
      step1_title: "Start Proxy",
      step1_desc: "Khởi động proxy server trên Trafexia Desktop app với một nút bấm duy nhất.",
      step2_title: "Quét mã QR",
      step2_desc: "Quét mã QR bằng camera điện thoại để tự động cấu hình proxy & cài đặt chứng chỉ bảo mật.",
      step3_title: "Bắt traffic",
      step3_desc: "Bắt đầu chặn đứng và phân tích các yêu cầu mạng HTTP/HTTPS hiển thị trực tiếp trên máy tính."
    },
    techStack: {
      tag: "TƯƠNG THÍCH",
      title: "Công nghệ hỗ trợ",
      subtitle: "Hoạt động trơn tru với các thư viện di động phổ biến, hệ điều hành native và web API."
    },
    download: {
      tag: "TẢI VỀ",
      title: "Tải Trafexia",
      subtitle: "Hỗ trợ đầy đủ các hệ điều hành phổ biến nhất cho nhà phát triển.",
      macos_pkg: "Gói cài đặt .dmg",
      macos_archs: "Universal (Hỗ trợ chip Intel & Apple Silicon)",
      windows_pkg: "Trình cài đặt .exe",
      windows_archs: "Kiến trúc x64",
      linux_pkg: "Gói chạy AppImage",
      linux_archs: "Kiến trúc x64 / arm64",
      cta: "Tải xuống miễn phí",
      warning_title: "SECURITY WARNING / CẢNH BÁO BẢO MẬT",
      warning_desc: "Ứng dụng này sinh chứng chỉ Root CA tự ký để giải mã lưu lượng HTTPS (MITM Proxy). Bạn chỉ nên cài đặt chứng chỉ CA và phân tích lưu lượng mạng trên thiết bị cá nhân hoặc thiết bị thử nghiệm được cấp quyền. Tuyệt đối không cài đặt chứng chỉ CA của Trafexia lên các thiết bị sản xuất hoặc thiết bị chứa thông tin nhạy cảm của người dùng khác mà không có sự đồng ý. Hãy gỡ cài đặt chứng chỉ sau khi kết thúc quá trình phân tích."
    },
    footer: {
      copyright: "Bản quyền đã được bảo lưu.",
      docs: "Tài liệu",
      github: "GitHub",
      releases: "Bản phát hành",
      license: "Giấy phép"
    }
  },
  zh: {
    nav: {
      features: "功能",
      docs: "文档",
      download: "下载",
      stars: "GitHub",
      cta: "免费下载"
    },
    hero: {
      tag: "移动流量拦截器",
      badge: "已拦截",
      headline: "Intercept. Decode. Reverse.",
      subtitle: "适用于 Android 和 iOS 的 MITM 代理。在桌面上捕获 HTTPS 流量、分析 API 和检测模式。",
      cta_mac: "下载 macOS 版",
      cta_github: "在 GitHub 上查看",
      stars: "GitHub Stars",
      forks: "Forks",
      release: "最新版本",
      license: "许可证"
    },
    features: {
      tag: "功能特点",
      title: "最大分析能力",
      subtitle: "拦截、分析和逆向移动应用程序所需的所有专业工具。",
      mitm_title: "MITM 代理",
      mitm_desc: "拦截 8888 端口上的 HTTP/HTTPS 流量。自动生成和管理安全的本地 CA 证书。",
      qr_title: "QR 设置",
      qr_desc: "只需扫描二维码即可快速配置移动设备（Android & iOS）上的代理设置。",
      pattern_title: "模式检测",
      pattern_desc: "自动检测并解码 HTTP 负载中的 JWT、API 密钥、Base64 字符串和 Bearer 令牌。",
      capture_title: "实时捕获",
      capture_desc: "以超低延迟和高度优化的流媒体实时观看实时网络流量。",
      filter_title: "高级过滤",
      filter_desc: "通过 HTTP 方法、状态代码、主机名或内容类型标头进行强大的基于正则的过滤。",
      export_title: "导出套件",
      export_desc: "将捕获的请求导出为 HAR 文件、cURL 命令、Python 请求脚本或 Postman 集合。"
    },
    howItWorks: {
      tag: "工作流程",
      title: "操作简单",
      subtitle: "无需复杂的网络知识。只需三个简单步骤即可拦截所有移动流量。",
      step1_title: "启动代理",
      step1_desc: "只需单击一下，即可在 Trafexia 桌面应用程序中启动代理服务器。",
      step2_title: "扫描二维码",
      step2_desc: "用手机摄像头扫描配置二维码，自动设置代理和证书。",
      step3_title: "捕获流量",
      step3_desc: "在您的桌面应用程序上即时捕获、检查和分析所有 HTTP/HTTPS 请求。"
    },
    techStack: {
      tag: "兼容性",
      title: "支持的技术",
      subtitle: "与主流移动框架、原生平台和 API 服务器无缝协作。"
    },
    download: {
      tag: "下载",
      title: "获取 Trafexia",
      subtitle: "适用于 macOS、Windows 和 Linux。选择与您的开发环境匹配的版本。",
      macos_pkg: ".dmg 安装包",
      macos_archs: "Universal (支持 Intel 和 Apple Silicon)",
      windows_pkg: ".exe 安装程序",
      windows_archs: "x64 架构",
      linux_pkg: ".AppImage 软件包",
      linux_archs: "x64 / arm64",
      cta: "免费下载",
      warning_title: "安全警告",
      warning_desc: "此应用程序生成自签名 Root CA 证书以解密 HTTPS 流量（MITM 代理）。您只能在个人或授权的测试设备上安装此 CA 证书并检查网络流量。切勿在包含敏感个人数据的生产设备上安装 CA 证书。调试完成后卸载证书。"
    },
    footer: {
      copyright: "保留所有权利。",
      docs: "文档",
      github: "GitHub",
      releases: "版本发布",
      license: "许可证"
    }
  },
  ja: {
    nav: {
      features: "機能",
      docs: "ドキュメント",
      download: "ダウンロード",
      stars: "GitHub",
      cta: "無料ダウンロード"
    },
    hero: {
      tag: "モバイルトラフィックインセプター",
      badge: "インターセプト完了",
      headline: "Intercept. Decode. Reverse.",
      subtitle: "AndroidおよびiOS用のMITMプロキシ。デスクトップ上でHTTPSトラフィックのキャプチャ、APIの分析、パターンの検出を行います。",
      cta_mac: "macOS版をダウンロード",
      cta_github: "GitHubで表示",
      stars: "GitHub Stars",
      forks: "フォーク",
      release: "最新リリース",
      license: "ライセンス"
    },
    features: {
      tag: "機能一覧",
      title: "最大級の分析機能",
      subtitle: "モバイルアプリのインターセプト、分析、リバースエンジニアリングに必要なすべてのプロフェッショナルツール。",
      mitm_title: "MITM プロキシ",
      mitm_desc: "ポート8888でHTTP/HTTPSトラフィックをインターセプト。ローカルCA証明書を自動生成・管理します。",
      qr_title: "QR設定",
      qr_desc: "QRコードをスキャンするだけで、モバイルデバイス（Android & iOS）のプロキシ設定を素早く構成します。",
      pattern_title: "パターン検出",
      pattern_desc: "HTTPペイロード内のJWT、APIキー、Base64文字列、Bearerトークンを自動検出しデコードします。",
      capture_title: "リアルタイムキャプチャ",
      capture_desc: "超低遅延で高度に最適化されたストリーミングにより、ライブネットワークトラフィックをリアルタイムで監視します。",
      filter_title: "高度なフィルタリング",
      filter_desc: "HTTPメソッド、ステータスコード、ホスト名、またはコンテンツタイプによる強力な正規表現フィルター。",
      export_title: "エクスポート機能",
      export_desc: "キャプチャしたリクエストをHARファイル、cURLコマンド、Python requestsスクリプト、またはPostmanコレクションとして出力。"
    },
    howItWorks: {
      tag: "ワークフロー",
      title: "シンプルな操作",
      subtitle: "複雑なネットワーク知識は不要。3つの簡単なステップでモバイルトラフィックを傍受します。",
      step1_title: "プロキシ起動",
      step1_desc: "Trafexiaデスクトップアプリ内のプロキシサーバーをワンクリックで起動します。",
      step2_title: "QRスキャン",
      step2_desc: "スマートフォンのカメラでQRコードをスキャンし、プロキシと証明書を自動設定します。",
      step3_title: "トラフィックのキャプチャ",
      step3_desc: "デスクトップアプリ上でHTTP/HTTPSリクエストを即座にキャプチャ、検査、分析します。"
    },
    techStack: {
      tag: "互換性",
      title: "サポート技術",
      subtitle: "主要なモバイルフレームワーク、ネイティブプラットフォーム、およびAPIサーバーと連携。"
    },
    download: {
      tag: "ダウンロード",
      title: "Trafexiaを入手",
      subtitle: "macOS、Windows、Linuxに対応。開発環境に合わせたバージョンを選択してください。",
      macos_pkg: ".dmg パッケージ",
      macos_archs: "Universal (Intel & Apple Silicon対応)",
      windows_pkg: ".exe インストーラー",
      windows_archs: "x64 アーキテクチャ",
      linux_pkg: ".AppImage バンドル",
      linux_archs: "x64 / arm64",
      cta: "無料ダウンロード",
      warning_title: "セキュリティ警告",
      warning_desc: "このアプリケーションは、HTTPSトラフィックを解読するために自己署名ルートCA証明書を生成します（MITMプロキシ）。このCA証明書のインストールおよびネットワークトラフィックの検査は、個人または許可されたテストデバイスでのみ行ってください。機密性の高い個人データを含む本番デバイスにCA証明書をインストールしないでください。デバッグ終了後は証明書をアンインストールしてください。"
    },
    footer: {
      copyright: "All rights reserved. 無断転載を禁じます。",
      docs: "ドキュメント",
      github: "GitHub",
      releases: "リリース",
      license: "ライセンス"
    }
  },
  ko: {
    nav: {
      features: "기능",
      docs: "문서",
      download: "다운로드",
      stars: "GitHub",
      cta: "무료 다운로드"
    },
    hero: {
      tag: "모바일 트래픽 인터셉터",
      badge: "인터셉트됨",
      headline: "Intercept. Decode. Reverse.",
      subtitle: "Android 및 iOS용 MITM 프록시. 데스크톱에서 HTTPS 트래픽 캡처, API 분석, 패턴 감지를 수행합니다.",
      cta_mac: "macOS용 다운로드",
      cta_github: "GitHub에서 보기",
      stars: "GitHub Stars",
      forks: "포크",
      release: "최신 릴리스",
      license: "라이센스"
    },
    features: {
      tag: "주요 기능",
      title: "강력한 분석 성능",
      subtitle: "모바일 애플리케이션의 인터셉트, 분석 및 리버스 엔지니어링에 필요한 모든 전문 도구.",
      mitm_title: "MITM 프록시",
      mitm_desc: "포트 8888에서 HTTP/HTTPS 트래픽을 인터셉트합니다. 로컬 CA 인증서를 자동으로 생성하고 관리합니다.",
      qr_title: "QR 설정",
      qr_desc: "QR 코드를 스캔하여 모바일 기기(Android 및 iOS)의 프록시 설정을 간편하게 구성합니다.",
      pattern_title: "패턴 탐지",
      pattern_desc: "HTTP 페이로드 내부의 JWT, API 키, Base64 문자열 및 Bearer 토큰을 자동으로 감지하고 디코딩합니다.",
      capture_title: "실시간 캡처",
      capture_desc: "최적화된 라이브 스트리밍을 통해 네크워크 트래픽 흐름을 초저지연 실시간 모니터링합니다.",
      filter_title: "고급 필터",
      filter_desc: "HTTP 메서드, 상태 코드, 호스트명 또는 콘텐츠 타입 헤더를 기준으로 강력한 정규식 필터링을 제공합니다.",
      export_title: "내보내기 도구",
      export_desc: "캡처한 요청을 HAR 파일, cURL 명령어, Python requests 스크립트 또는 Postman 콜렉션으로 내보냅니다."
    },
    howItWorks: {
      tag: "작업 흐름",
      title: "간편한 시작",
      subtitle: "복잡한 네트워크 지식이 없어도 괜찮습니다. 세 단계의 설정으로 모바일 트래픽을 즉시 캡처합니다.",
      step1_title: "프록시 시작",
      step1_desc: "Trafexia 데스크톱 앱 내에서 프록시 서버를 원클릭으로 구동합니다.",
      step2_title: "QR 스캔",
      step2_desc: "모바일 카메라로 설정 QR 코드를 스캔하여 프록시와 인증서를 자동으로 설치합니다.",
      step3_title: "트래픽 분석",
      step3_desc: "데스크톱 앱으로 전달되는 실시간 HTTP/HTTPS 네트워크 트래픽을 모니터링하고 분석합니다."
    },
    techStack: {
      tag: "호환성",
      title: "지원 기술",
      subtitle: "주요 모바일 프레임워크, 네이티브 플랫폼 및 웹 API 서버들과 완벽하게 연동됩니다."
    },
    download: {
      tag: "다운로드",
      title: "다운로드",
      subtitle: "macOS, Windows 및 Linux 지원. 개발 환경에 맞는 버전을 선택하여 다운로드하세요.",
      macos_pkg: ".dmg 패키지",
      macos_archs: "Universal (Intel & Apple Silicon 지원)",
      windows_pkg: ".exe 설치 프로그램",
      windows_archs: "x64 아키텍처",
      linux_pkg: ".AppImage 번들",
      linux_archs: "x64 / arm64",
      cta: "무료 다운로드",
      warning_title: "보안 경고",
      warning_desc: "이 애플리케이션은 HTTPS 트래픽을 해독하기 위해 자체 서명된 루트 CA 인증서를 생성합니다 (MITM 프록시). 이 CA 인증서 설치 및 네트워크 트래픽 검사는 개인 또는 권한이 부여된 테스트 기기에서만 수행해야 합니다. 민감한 개인 데이터가 포함된 실제 운영 기기에는 CA 인증서를 설치하지 마십시오. 디버깅이 끝나면 인증서를 삭제하십시오."
    },
    footer: {
      copyright: "모든 권리 보유.",
      docs: "문서",
      github: "GitHub",
      releases: "릴리스",
      license: "라이센스"
    }
  },
  es: {
    nav: {
      features: "Características",
      docs: "Docs",
      download: "Descargar",
      stars: "GitHub",
      cta: "Descargar Gratis"
    },
    hero: {
      tag: "INTERCEPTOR DE TRÁFICO MÓVIL",
      badge: "INTERCEPTADO",
      headline: "Intercept. Decode. Reverse.",
      subtitle: "Proxy MITM para Android e iOS. Captura tráfico HTTPS, analiza APIs, detecta patrones — directamente en tu escritorio.",
      cta_mac: "Descargar para macOS",
      cta_github: "Ver en GitHub",
      stars: "GitHub Stars",
      forks: "Forks",
      release: "Última Versión",
      license: "Licencia"
    },
    features: {
      tag: "CARACTERÍSTICAS",
      title: "Máximo Poder de Análisis",
      subtitle: "Todas las herramientas profesionales que necesitas para interceptar, analizar y aplicar ingeniería inversa a apps móviles.",
      mitm_title: "Proxy MITM",
      mitm_desc: "Intercepta tráfico HTTP/HTTPS en el puerto 8888. Genera y administra automáticamente certificados CA locales seguros.",
      qr_title: "Configuración QR",
      qr_desc: "Configura rápidamente el proxy en tu dispositivo móvil (Android o iOS) simplemente escaneando un código QR.",
      pattern_title: "Detección de Patrones",
      pattern_desc: "Detecta y decodifica automáticamente JWTs, claves API, cadenas Base64 y tokens Bearer en cargas HTTP.",
      capture_title: "Captura en Tiempo Real",
      capture_desc: "Monitorea el tráfico de red en vivo en tiempo real con latencia ultra baja y streaming optimizado.",
      filter_title: "Filtro Avanzado",
      filter_desc: "Filtrado potente basado en expresiones regulares por método HTTP, código de estado, host o tipo de contenido.",
      export_title: "Suite de Exportación",
      export_desc: "Exporta peticiones como archivos HAR, comandos cURL, scripts de Python requests o colecciones de Postman."
    },
    howItWorks: {
      tag: "PROCESO",
      title: "Operación Simple",
      subtitle: "No requiere conocimientos complejos de red. Tres pasos simples para interceptar el tráfico móvil.",
      step1_title: "Iniciar Proxy",
      step1_desc: "Inicia el servidor proxy dentro de la app Trafexia Desktop con un solo clic.",
      step2_title: "Escanear QR",
      step2_desc: "Escanea el código QR con la cámara de tu móvil para autoconfigurar el proxy y el certificado.",
      step3_title: "Capturar Tráfico",
      step3_desc: "Inspecciona y analiza instantáneamente todas las solicitudes HTTP/HTTPS en tu aplicación de escritorio."
    },
    techStack: {
      tag: "COMPATIBILIDAD",
      title: "Tecnologías Compatibles",
      subtitle: "Funciona perfectamente con los principales frameworks móviles, plataformas nativas y servidores API."
    },
    download: {
      tag: "DESCARGA",
      title: "Obtener Trafexia",
      subtitle: "Disponible para macOS, Windows y Linux. Elige la versión que coincida con tu entorno de desarrollo.",
      macos_pkg: "Paquete .dmg",
      macos_archs: "Universal (Intel y Apple Silicon)",
      windows_pkg: "Instalador .exe",
      windows_archs: "Arquitectura x64",
      linux_pkg: "Paquete .AppImage",
      linux_archs: "Arquitectura x64 / arm64",
      cta: "Descargar Gratis",
      warning_title: "ADVERTENCIA DE SEGURIDAD",
      warning_desc: "Esta aplicación genera un certificado Root CA autofirmado para descifrar tráfico HTTPS (Proxy MITM). Solo debe instalar este certificado y examinar el tráfico en dispositivos personales o autorizados. Nunca instale el certificado CA en dispositivos de producción que contengan datos personales confidenciales. Desinstale el certificado al finalizar."
    },
    footer: {
      copyright: "Todos los derechos reservados.",
      docs: "Documentación",
      github: "GitHub",
      releases: "Lanzamientos",
      license: "Licencia"
    }
  },
  fr: {
    nav: {
      features: "Fonctionnalités",
      docs: "Docs",
      download: "Télécharger",
      stars: "GitHub",
      cta: "Télécharger Gratuit"
    },
    hero: {
      tag: "INTERCEPTEUR DE TRAFIC MOBILE",
      badge: "INTERCEPTÉ",
      headline: "Intercept. Decode. Reverse.",
      subtitle: "Proxy MITM pour Android et iOS. Capturez le trafic HTTPS, analysez les API, détectez les modèles — directement sur votre bureau.",
      cta_mac: "Télécharger pour macOS",
      cta_github: "Voir sur GitHub",
      stars: "GitHub Stars",
      forks: "Forks",
      release: "Dernière Version",
      license: "Licence"
    },
    features: {
      tag: "FONCTIONNALITÉS",
      title: "Puissance d'Analyse Maximale",
      subtitle: "Tous les outils professionnels indispensables pour intercepter, analyser et retro-concevoir des applications mobiles.",
      mitm_title: "Proxy MITM",
      mitm_desc: "Interceptez le trafic HTTP/HTTPS sur le port 8888. Générez et gérez automatiquement des certificats CA locaux sécurisés.",
      qr_title: "Configuration QR",
      qr_desc: "Configurez rapidement le proxy sur votre appareil mobile (Android et iOS) simplement en scannant un code QR.",
      pattern_title: "Détection de Modèles",
      pattern_desc: "Détectez et décodez automatiquement les JWT, clés API, chaînes Base64 et tokens Bearer dans les requêtes HTTP.",
      capture_title: "Capture en Temps Réel",
      capture_desc: "Suivez le trafic réseau en direct en temps réel avec une latence ultra-faible et un flux optimisé.",
      filter_title: "Filtrage Avancé",
      filter_desc: "Filtres puissants basés sur des expressions régulières par méthode HTTP, code d'état, hôte ou type de contenu.",
      export_title: "Suite d'Exportation",
      export_desc: "Exportez les requêtes capturées sous forme de fichiers HAR, commandes cURL, scripts Python ou collections Postman."
    },
    howItWorks: {
      tag: "PROCESSUS",
      title: "Fonctionnement Simple",
      subtitle: "Aucune connaissance réseau complexe requise. Trois étapes simples pour intercepter tout le trafic mobile.",
      step1_title: "Lancer le Proxy",
      step1_desc: "Démarrez le serveur proxy dans l'application Trafexia Desktop en un seul clic.",
      step2_title: "Scanner le QR",
      step2_desc: "Scannez le code QR avec votre caméra mobile pour configurer automatiquement le proxy et le certificat.",
      step3_title: "Analyser le Trafic",
      step3_desc: "Inspectez et analysez instantanément toutes les requêtes HTTP/HTTPS sur votre application de bureau."
    },
    techStack: {
      tag: "COMPATIBILITÉ",
      title: "Technologies Supportées",
      subtitle: "Fonctionne de manière transparente avec les frameworks mobiles, plateformes natives et serveurs API populaires."
    },
    download: {
      tag: "TÉLÉCHARGEMENT",
      title: "Obtenir Trafexia",
      subtitle: "Disponible pour macOS, Windows et Linux. Choisissez la version correspondant à votre environnement de développement.",
      macos_pkg: "Paquet .dmg",
      macos_archs: "Universal (Intel & Apple Silicon)",
      windows_pkg: "Installateur .exe",
      windows_archs: "Architecture x64",
      linux_pkg: "Fichier .AppImage",
      linux_archs: "Architecture x64 / arm64",
      cta: "Télécharger Gratuit",
      warning_title: "AVERTISSEMENT DE SÉCURITÉ",
      warning_desc: "Cette application génère un certificat Root CA auto-signé pour déchiffrer le trafic HTTPS (Proxy MITM). Vous devez uniquement installer ce certificat et inspecter le trafic sur des appareils personnels ou autorisés. N'installez jamais le certificat CA sur des appareils de production contenant des données personnelles sensibles. Désinstallez le certificat une fois le débogage terminé."
    },
    footer: {
      copyright: "Tous droits réservés.",
      docs: "Documentation",
      github: "GitHub",
      releases: "Versions",
      license: "Licence"
    }
  },
  de: {
    nav: {
      features: "Funktionen",
      docs: "Docs",
      download: "Herunterladen",
      stars: "GitHub",
      cta: "Kostenlos Herunterladen"
    },
    hero: {
      tag: "MOBILER TRAFFIC-INTERCEPTOR",
      badge: "ABGEFANGEN",
      headline: "Intercept. Decode. Reverse.",
      subtitle: "MITM-Proxy für Android und iOS. HTTPS-Traffic erfassen, APIs analysieren, Muster erkennen — direkt auf Ihrem Desktop.",
      cta_mac: "Für macOS herunterladen",
      cta_github: "Auf GitHub ansehen",
      stars: "GitHub Stars",
      forks: "Forks",
      release: "Neueste Version",
      license: "Lizenz"
    },
    features: {
      tag: "FUNKTIONEN",
      title: "Maximale Analysekraft",
      subtitle: "Alle professionellen Werkzeuge, die Sie zum Abfangen, Analysieren und Reverse Engineering von mobilen Apps benötigen.",
      mitm_title: "MITM-Proxy",
      mitm_desc: "Abfangen von HTTP/HTTPS-Verkehr auf Port 8888. Lokale sichere CA-Zertifikate automatisch generieren und verwalten.",
      qr_title: "QR-Einrichtung",
      qr_desc: "Konfigurieren Sie die Proxy-Einstellungen auf Ihrem Mobilgerät (Android & iOS) schnell per QR-Code-Scan.",
      pattern_title: "Mustererkennung",
      pattern_desc: "Erkennen und decodieren Sie automatisch JWTs, API-Schlüssel, Base64-Strings und Bearer-Token in HTTP-Payloads.",
      capture_title: "Echtzeit-Erfassung",
      capture_desc: "Überwachen Sie den Live-Netzwerkverkehr in Echtzeit mit extrem geringer Latenz und optimiertem Streaming.",
      filter_title: "Erweiterter Filter",
      filter_desc: "Leistungsstarke Regex-Filterung nach HTTP-Methode, Statuscode, Hostname oder Inhaltstyp.",
      export_title: "Export-Suite",
      export_desc: "Exportieren Sie erfasste Anfragen als HAR-Dateien, cURL-Befehle, Python requests-Skripte oder Postman-Collections."
    },
    howItWorks: {
      tag: "ABLAUF",
      title: "Einfache Bedienung",
      subtitle: "Keine komplexen Netzwerkkenntnisse erforderlich. Drei einfache Schritte zum Abfangen des mobilen Verkehrs.",
      step1_title: "Proxy starten",
      step1_desc: "Starten Sie den Proxy-Server in der Trafexia-Desktop-App mit einem einzigen Klick.",
      step2_title: "QR scannen",
      step2_desc: "Scannen Sie den QR-Code mit Ihrer Handykamera, um Proxy und Zertifikat automatisch einzurichten.",
      step3_title: "Traffic analysieren",
      step3_desc: "Analysieren und inspizieren Sie sofort alle HTTP/HTTPS-Anfragen in Ihrer Desktop-Anwendung."
    },
    techStack: {
      tag: "KOMPATIBILITÄT",
      title: "Unterstützte Technologien",
      subtitle: "Funktioniert nahtlos mit gängigen mobilen Frameworks, nativen Plattformen und API-Servern."
    },
    download: {
      tag: "DOWNLOAD",
      title: "Trafexia Herunterladen",
      subtitle: "Verfügbar für macOS, Windows und Linux. Wählen Sie die passende Version für Ihre Entwicklungsumgebung.",
      macos_pkg: ".dmg Installationsdatei",
      macos_archs: "Universal (Intel & Apple Silicon)",
      windows_pkg: ".exe Installer",
      windows_archs: "x64-Architektur",
      linux_pkg: ".AppImage Paket",
      linux_archs: "x64 / arm64-Architektur",
      cta: "Kostenlos Herunterladen",
      warning_title: "SICHERHEITSHINWEIS",
      warning_desc: "Diese Anwendung generiert ein selbstsigniertes Root-CA-Zertifikat zum Entschlüsseln von HTTPS-Verkehr (MITM-Proxy). Sie sollten dieses CA-Zertifikat nur auf persönlichen oder autorisierten Testgeräten installieren. Installieren Sie das CA-Zertifikat niemals auf Produktionsgeräten mit sensiblen persönlichen Daten. Deinstallieren Sie das Zertifikat nach dem Testen."
    },
    footer: {
      copyright: "Alle Rechte vorbehalten.",
      docs: "Dokumentation",
      github: "GitHub",
      releases: "Releases",
      license: "Lizenz"
    }
  },
  ru: {
    nav: {
      features: "Функции",
      docs: "Документация",
      download: "Скачать",
      stars: "GitHub",
      cta: "Скачать Бесплатно"
    },
    hero: {
      tag: "ПЕРЕХВАТЧИК МОБИЛЬНОГО ТРАФИКА",
      badge: "ПЕРЕХВАЧЕНО",
      headline: "Intercept. Decode. Reverse.",
      subtitle: "MITM-прокси для Android и iOS. Перехват HTTPS-трафика, анализ API, обнаружение паттернов — прямо на вашем компьютере.",
      cta_mac: "Скачать для macOS",
      cta_github: "Посмотреть на GitHub",
      stars: "GitHub Stars",
      forks: "Форки",
      release: "Последний релиз",
      license: "Лицензия"
    },
    features: {
      tag: "ФУНКЦИИ",
      title: "Максимум возможностей анализа",
      subtitle: "Все профессиональные инструменты, необходимые для перехвата, анализа и обратной разработки мобильных приложений.",
      mitm_title: "MITM-прокси",
      mitm_desc: "Перехват HTTP/HTTPS-трафика на порту 8888. Автоматическая генерация и управление безопасными локальными сертификатами CA.",
      qr_title: "QR-настройка",
      qr_desc: "Быстро настройте параметры прокси на мобильном устройстве (Android & iOS), просто отсканировав QR-код.",
      pattern_title: "Определение паттернов",
      pattern_desc: "Автоматическое обнаружение и декодирование JWT, API-ключей, строк Base64 и Bearer-токенов в HTTP-запросах.",
      capture_title: "Захват в реальном времени",
      capture_desc: "Просматривайте сетевой трафик в реальном времени с ультранизкой задержкой и оптимизированным потоком.",
      filter_title: "Продвинутый фильтр",
      filter_desc: "Мощная фильтрация на основе регулярных выражений по HTTP-методу, коду состояния, хосту или типу контента.",
      export_title: "Гибкий экспорт",
      export_desc: "Экспорт перехваченных запросов в файлы HAR, команды cURL, скрипты Python requests или коллекции Postman."
    },
    howItWorks: {
      tag: "ПРОЦЕСС",
      title: "Простое использование",
      subtitle: "Не требуется сложных сетевых знаний. Три простых шага для перехвата всего мобильного трафика.",
      step1_title: "Запуск прокси",
      step1_desc: "Запустите прокси-сервер в настольном приложении Trafexia одним щелчком мыши.",
      step2_title: "Сканирование QR",
      step2_desc: "Отсканируйте конфигурационный QR-код камерой телефона для автонастройки прокси и сертификата.",
      step3_title: "Анализ трафика",
      step3_desc: "Мгновенно проверяйте и анализируйте все запросы HTTP/HTTPS в вашем настольном приложении."
    },
    techStack: {
      tag: "СОВМЕСТИМОСТЬ",
      title: "Поддерживаемые технологии",
      subtitle: "Бесшовная работа с популярными мобильными фреймворками, нативными платформами и API-серверами."
    },
    download: {
      tag: "СКАЧАТЬ",
      title: "Скачать Trafexia",
      subtitle: "Доступно для macOS, Windows и Linux. Выберите версию, соответствующую вашей среде разработки.",
      macos_pkg: "Пакет .dmg",
      macos_archs: "Universal (поддержка Intel и Apple Silicon)",
      windows_pkg: "Установщик .exe",
      windows_archs: "Архитектура x64",
      linux_pkg: "Пакет .AppImage",
      linux_archs: "Архитектура x64 / arm64",
      cta: "Скачать Бесплатно",
      warning_title: "ПРЕДУПРЕЖДЕНИЕ О БЕЗОПАСНОСТИ",
      warning_desc: "Это приложение генерирует самоподписанный корневой сертификат CA для расшифровки HTTPS-трафика (MITM-прокси). Устанавливать этот сертификат и анализировать трафик следует только на личных или авторизованных тестовых устройствах. Никогда не устанавливайте сертификат CA на рабочие устройства, содержащие конфиденциальные личные данные. Удалите сертификат после завершения отладки."
    },
    footer: {
      copyright: "Все права защищены.",
      docs: "Документация",
      github: "GitHub",
      releases: "Релизы",
      license: "Лицензия"
    }
  },
  pt: {
    nav: {
      features: "Recursos",
      docs: "Docs",
      download: "Baixar",
      stars: "GitHub",
      cta: "Baixar Grátis"
    },
    hero: {
      tag: "INTERCEPTADOR DE TRÁFEGO MÓVEL",
      badge: "INTERCEPTADO",
      headline: "Intercept. Decode. Reverse.",
      subtitle: "Proxy MITM para Android e iOS. Capture tráfego HTTPS, analise APIs, detecte padrões — direto no seu desktop.",
      cta_mac: "Baixar para macOS",
      cta_github: "Ver no GitHub",
      stars: "GitHub Stars",
      forks: "Forks",
      release: "Última Versão",
      license: "Licença"
    },
    features: {
      tag: "RECURSOS",
      title: "Poder Máximo de Análise",
      subtitle: "Todas as ferramentas profissionais necessárias para interceptar, analisar e aplicar engenharia reversa em apps móveis.",
      mitm_title: "Proxy MITM",
      mitm_desc: "Intercepte tráfego HTTP/HTTPS na porta 8888. Gere e gerencie automaticamente certificados CA locais seguros.",
      qr_title: "Configuração QR",
      qr_desc: "Configure rapidamente o proxy no seu dispositivo móvel (Android ou iOS) simplesmente escaneando um código QR.",
      pattern_title: "Detecção de Padrões",
      pattern_desc: "Detecte e decodifique automaticamente JWTs, chaves API, strings Base64 e tokens Bearer em pacotes HTTP.",
      capture_title: "Captura em Tempo Real",
      capture_desc: "Monitore o tráfego de rede ao vivo em tempo real com latência ultra-baixa e streaming otimizado.",
      filter_title: "Filtro Avançado",
      filter_desc: "Filtragem poderosa baseada em expressões regulares por método HTTP, código de status, host ou tipo de conteúdo.",
      export_title: "Exportação de Dados",
      export_desc: "Exporte as requisições capturadas como arquivos HAR, comandos cURL, scripts Python requests ou coleções do Postman."
    },
    howItWorks: {
      tag: "FLUXO",
      title: "Operação Simples",
      subtitle: "Não requer conhecimentos de rede complexos. Três passos simples para interceptar o tráfego móvel.",
      step1_title: "Iniciar Proxy",
      step1_desc: "Inicie o servidor proxy no aplicativo Trafexia Desktop com um único clique.",
      step2_title: "Escanear QR",
      step2_desc: "Escaneie o código QR com a câmera do celular para autoconfigurar o proxy e o certificado.",
      step3_title: "Capturar Tráfego",
      step3_desc: "Inspecione e analise instantaneamente todas as solicitações HTTP/HTTPS no seu aplicativo desktop."
    },
    techStack: {
      tag: "COMPATIBILIDADE",
      title: "Tecnologias Suportadas",
      subtitle: "Funciona perfeitamente com os principais frameworks móveis, plataformas nativas e servidores de API."
    },
    download: {
      tag: "DOWNLOAD",
      title: "Baixar Trafexia",
      subtitle: "Disponível para macOS, Windows e Linux. Escolha a versão correspondente ao seu ambiente de desenvolvimento.",
      macos_pkg: "Pacote .dmg",
      macos_archs: "Universal (Intel e Apple Silicon)",
      windows_pkg: "Instalador .exe",
      windows_archs: "Arquitetura x64",
      linux_pkg: "Fichier .AppImage",
      linux_archs: "Arquitetura x64 / arm64",
      cta: "Baixar Grátis",
      warning_title: "AVISO DE SEGURANÇA",
      warning_desc: "Este aplicativo gera um certificado Root CA autoassinado para descriptografar tráfego HTTPS (Proxy MITM). Você deve apenas instalar este certificado e inspecionar o tráfego em dispositivos pessoais ou autorizados. Nunca instale o certificado CA em dispositivos de produção contendo dados pessoais confidenciais. Remova o certificado ao terminar."
    },
    footer: {
      copyright: "Todos os direitos reservados.",
      docs: "Documentação",
      github: "GitHub",
      releases: "Lançamentos",
      license: "Licença"
    }
  }
};
