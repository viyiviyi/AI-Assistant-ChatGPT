import { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

let zIndex = 99;
const modalIdxList: number[] = [];

export const Modal = ({ open, content, onClose }: { open: boolean; content: React.ReactNode; onClose: () => void }) => {
    const router = useRouter();
    const [index, setIndex] = useState(0);
    const [show, setShow] = useState(false);

    useEffect(() => {
        setShow((v) => {
            if (v != open) {
                if (open) {
                    zIndex += 1;
                    router.push(router.asPath + "#" + zIndex);
                    modalIdxList.push(zIndex);
                    setIndex(zIndex);
                } else {
                    zIndex -= 1;
                    setTimeout(() => {
                        // 解决有多个弹窗时popstate事件连续触发的问题
                        modalIdxList.length -= 1;
                    }, 0);
                }
            }
            return open;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleBackButton = useMemo(() => {
        return (ev: PopStateEvent) => {
            ev.preventDefault();
            setIndex((v) => {
                if (!modalIdxList.length || v != modalIdxList[modalIdxList.length - 1]) return v;
                onClose();
                return v;
            });
        };
    }, [onClose]);

    useEffect(() => {
        window.addEventListener("popstate", handleBackButton);
        return () => {
            window.removeEventListener("popstate", handleBackButton);
        };
    }, [handleBackButton]);
    if (!open) return <></>;
    let wrap = (
        <div style={{ position: "fixed", left: 0, top: 0, width: "100%", height: "100%", overflow: "auto", zIndex: zIndex }}>
            <span
                style={{ cursor: "pointer", position: "fixed", top: 0, right: 10, padding: 10, zIndex: 1 }}
                onClick={(e) => {
                    e.stopPropagation();
                    router.back();
                }}
            >
                ✖
            </span>
            {content}
        </div>
    );
    return createPortal(wrap as any, document.body);
};
