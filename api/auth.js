// api/auth.js
export default function handler(req, res) {
  const correctHash = process.env.SITE_PASSWORD_HASH; // 哈希值存环境变量
  const userHash = req.cookies.site_auth;

  if (userHash === correctHash) {
    // 已验证，返回真实首页（需从public目录读取或反向代理）
    res.redirect(302, '/');
  } else {
    // 未验证，返回密码页
    res.status(401).send(`...密码页HTML代码...`);
  }
}
