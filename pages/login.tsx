import { KeyValueData } from "@/core/KeyValueData";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Form, Input } from "antd";
import { useRouter } from "next/router";
import React from "react";
import { useState } from "react";

const Login = () => {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [message, setMessage] = useState("请登录");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  function submit() {
    setLoading(true);
    fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user, pass }),
    }).then(async (res) => {
      if (res.status != 200) {
        setLoading(false);
        setMessage("登录失败");
        return;
      }
      const result = await res.json();
      if (result.error) {
        setLoading(false);
        setMessage(result.error.message);
        return;
      }
      new KeyValueData(localStorage).setAutoToken(result.result);
      router.back();
    });
  }
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <p style={{ textAlign: "center", padding: "20px" }}>
        {loading ? "loading..." : message}
      </p>
      <Form
        style={{
          width: "300px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: "Please input your Username!" }]}
        >
          <Input
            onChange={(e) => setUser(e.target.value)}
            prefix={<UserOutlined className="site-form-item-icon" />}
            placeholder="Username"
          />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: "Please input your Password!" }]}
        >
          <Input
            onChange={(e) => setPass(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && submit()}
            prefix={<LockOutlined className="site-form-item-icon" />}
            type="password"
            placeholder="Password"
          />
        </Form.Item>
        <Form.Item>
          <Button block
            onClick={submit}
            type="primary"
            htmlType="submit"
            className="login-form-button"
          >
            登录
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Login;
