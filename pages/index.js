import Head from "next/head";
import { useEffect, useState } from "react";
import styles from "./index.module.css";
import { remark } from "remark";
import html from "remark-html";

function Markdown(props = { content: "" }) {
  let [contentHtml, setContent] = useState("");

  useEffect(() => {
    remark()
      .use(html)
      .process(props.content)
      .then((res) => {
        setContent(res.toString());
      });
  }, [props]);
  return <div dangerouslySetInnerHTML={{ __html: contentHtml }} />;
}

export default function Home() {
  const [messageInput, setmessageInput] = useState("");
  const [messages, setMessage] = useState([]);
  const [config, setConfig] = useState({});
  function pauseContent(msg, user) {
    return "*" + new Date().toLocaleString() + "* **" + user + "** \n\n " + msg;
  }
  async function onSubmit(event) {
    event.preventDefault();
    setMessage((v) => {
      return [...v, pauseContent(messageInput, config.user || "user")];
    });
    setmessageInput("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageInput }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw (
          data.error ||
          new Error(`Request failed with status ${response.status}`)
        );
      }
      setMessage((v) => {
        return [...v, pauseContent(data.result, "Bot")];
      });
    } catch (error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      setMessage((v) => {
        return [...v, pauseContent(error.message, "Bot Error")];
      });
      // setMessage([...messages, error.message]);
    }
  }

  useEffect(() => {
    setTimeout(() => {
      var div = document.getElementById("content");
      div.scrollTop = div.scrollHeight;
    }, 300);
  }, [messages]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Head>
        <title>助手 bot</title>
      </Head>
      <div className={styles.content} id="content">
        {messages.map((msg) => (
          <Markdown content={msg}></Markdown>
        ))}
      </div>
      <main className={styles.main}>
        <form onSubmit={onSubmit}>
          <input
            type="text"
            name="message"
            placeholder="Enter an message"
            value={messageInput}
            onChange={(e) => setmessageInput(e.target.value)}
          />
          <input type="submit" />
        </form>
      </main>
    </div>
  );
}
