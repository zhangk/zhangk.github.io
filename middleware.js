// middleware.js - 适用于 Node.js Runtime
const { parse } = require('cookie');
const { stringify } = require('querystring');

module.exports = async (req, res) => {
  // 1. 从环境变量读取正确密码
  const correctPassword = process.env.SITE_PASSWORD;
  
  // 2. 从Cookie或URL查询参数中获取用户输入的密码
  const cookies = parse(req.headers.cookie || '');
  const userPassword = cookies['site-password'] || req.query.password;

  // 3. 密码正确，放行请求（继续执行Hugo的静态文件服务）
  if (userPassword === correctPassword) {
    // 如果是通过URL参数验证成功，则设置Cookie，方便下次访问
    if (req.query.password) {
      res.setHeader('Set-Cookie', `site-password=${userPassword}; Path=/; Max-Age=${60 * 60 * 24 * 7}`); // 有效期7天
    }
    // 重要：调用 return，让请求继续由Vercel的静态托管处理
    return;
  }

  // 4. 密码不正确，返回401登录页面
  res.statusCode = 401;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>验证访问</title>
      <style>
        body { font-family: sans-serif; padding: 2rem; text-align: center; }
        input, button { padding: 0.5rem; font-size: 1rem; margin-top: 0.5rem; }
      </style>
    </head>
    <body>
      <h2>需要密码</h2>
      <p>请输入密码访问此站点：</p>
      <form method="GET">
        <input type="password" name="password" placeholder="密码" required>
        <button type="submit">进入</button>
      </form>
      <p><small>提示：密码已设置在Vercel的环境变量 SITE_PASSWORD 中。</small></p>
    </body>
    </html>
  `);
};
