import { autoToken } from "@/hooks/authToken";
import { Router, useRouter } from "next/router";
import React from "react";
import { useState } from "react";

const Login = () => {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [message, setMessage] = useState("请登录");
  const passRef = React.createRef<HTMLInputElement>();
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
        console.log(await res.json());
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
      autoToken(result.result);
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
      <form
        style={{
          width: "300px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <input
          style={{
            marginBottom: "10px",
            lineHeight: 1.5,
            fontSize: "16px",
            height: "2em",
            textIndent: "1em",
          }}
          autoFocus={true}
          onChange={(e) => setUser(e.target.value)}
          onKeyUp={(e) => e.key === "Enter" && passRef.current?.focus()}
          type="text"
          name="username"
          id=""
        />
        <input
          style={{
            marginBottom: "10px",
            lineHeight: 1.5,
            fontSize: "16px",
            height: "2em",
            textIndent: "1em",
          }}
          ref={passRef}
          onChange={(e) => setPass(e.target.value)}
          onKeyUp={(e) => e.key === "Enter" && submit()}
          type="password"
          name="password"
          id=""
        />
        <input
          style={{
            marginBottom: "10px",
            lineHeight: 2,
            fontSize: "16px",
            height: "2.5em",
            textIndent: "1em",
            cursor: "pointer",
          }}
          onClick={submit}
          type="button"
          value="登录"
        />
      </form>
    </div>
  );
};

export default Login;
