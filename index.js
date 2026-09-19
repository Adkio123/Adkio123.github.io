const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const mailUser = process.env.MAIL_USER;
const mailPass = process.env.MAIL_PASS;

const transporter = nodemailer.createTransport({
  host: "smtp.qq.com",
  port: 465,
  secure: true,
  auth: {
    user: mailUser,
    pass: mailPass
  }
});

const codeStore = new Map();

app.post('/api/send-code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ok:false,msg:"邮箱不能为空"});
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  codeStore.set(email, {code, expire: Date.now() + 5 * 60 * 1000});
  try {
    await transporter.sendMail({
      from: `"签到系统" <${mailUser}>`,
      to: email,
      subject: "签到系统验证码",
      text: `你的验证码是：${code}\n有效期5分钟，请勿泄露给他人`
    })
    res.json({ok:true,msg:"验证码已发送，请查收邮箱"});
  }catch(err){
    console.error(err);
    res.json({ok:false,msg:"发送失败，请检查配置"});
  }
})

app.post('/api/verify-code', (req, res)=>{
  const {email, code} = req.body;
  const data = codeStore.get(email);
  if(!data) return res.json({ok:false,msg:"请先获取验证码"});
  if(Date.now() > data.expire){
    codeStore.delete(email);
    return res.json({ok:false,msg:"验证码已过期"});
  }
  if(data.code === code){
    codeStore.delete(email);
    return res.json({ok:true,msg:"验证成功"});
  }else{
    return res.json({ok:false,msg:"验证码错误"});
  }
})

app.listen(port, () => {
  console.log(`服务启动`);
})
