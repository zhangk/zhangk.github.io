// middleware.js
import { next } from '@vercel/edge';

export const config = {
  matcher: '/((?!api|static|.*\\..*|_next).*)', // 保护所有页面，排除静态资源
};

export default function middleware(req) {
  // 1. 从环境变量读取正确密码
  const correctPassword = process.env.SITE_PASSWORD;
  
  // 2. 从请求的Cookie或URL查询参数中读取用户输入的密码
  const url = new URL(req.url);
  const userPassword = req.cookies.get('site-password') || url.searchParams.get('password');

  // 3. 密码正确，放行请求
  if (userPassword === correctPassword) {
    const response = next();
    // 为了方便，如果通过URL参数验证成功，则设置Cookie，下次无需再输
    if (url.searchParams.has('password')) {
      response.cookies.set('site-password', userPassword, { path: '/', maxAge: 60 * 60 * 24 * 7 }); // 有效期7天
    }
    return response;
  }

  // 4. 密码不正确，返回401登录页面
  return new Response(
    `
    <!DOCTYPE html>
    <html>
    <head><title>验证访问</title><style>body{font-family:sans-serif;padding:2rem;text-align:center;}</style></head>
    <body>
      <h2>需要密码</h2>
      <p>请输入密码访问此站点：</p>
      <form method="get">
        <input type="password" name="password" placeholder="密码">
        <button type="submit">进入</button>
      </form>
    </body>
    </html>
    `,
    {
      status: 401,
      headers: { 'Content-Type': 'text/html' },
    }
  );
}
