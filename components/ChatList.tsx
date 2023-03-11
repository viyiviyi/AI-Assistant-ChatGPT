import { CahtManagement } from "@/core/ChatManagement";
import { useEffect, useState } from "react";
import style from "../styles/chat-list.module.css";
export const ChatList = ({
  onSelected,
  onCacle,
}: {
  onCacle: () => void;
  onSelected: (chatMgt: CahtManagement) => void;
}) => {
  async function create() {
    await CahtManagement.provide().then(onSelected);
  }
  return (
    <>
      <div className={style.listWrap}>
        <div className={style.list}>
          {CahtManagement.getList().map((v, idx) => (
            <div className={style.item} key={idx} onClick={() => onSelected(v)}>
              <div></div>
              <div>
                <span>{v.config.name}</span>
              </div>
            </div>
          ))}

          <div className={style.item} onClick={() => create()}>
            <div></div>
            <div>
              <span>新建</span>
            </div>
          </div>
          <div
            className={style.item}
            style={{ marginTop: "30px", justifyContent: "center" }}
            onClick={() => onCacle()}
          >
            <span>关闭</span>
          </div>
        </div>
      </div>
    </>
  );
};
