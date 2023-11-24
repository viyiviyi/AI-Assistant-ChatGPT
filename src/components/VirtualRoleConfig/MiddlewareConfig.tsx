import { ChatContext } from "@/core/ChatManagement";
import { getUuid } from "@/core/utils/utils";
import { getMiddlewareList } from "@/middleware/execMiddleware";
import { IMiddleware } from "@/middleware/IMiddleware";
import { VirtualRoleSetting } from "@/Models/VirtualRoleSetting";
import { Switch, Tag, theme, Typography } from "antd";
import { useCallback, useContext } from "react";

export const MiddlewareConfig = ({
  middlewares,
  setMiddlewares,
  inputSettings,
  changeSetting,
}: {
  middlewares: string[];
  setMiddlewares: (val: string[] | ((last: string[]) => string[])) => void;
  inputSettings: Array<VirtualRoleSetting>;
  changeSetting: (val: Array<VirtualRoleSetting>) => void;
}) => {
  const { chatMgt } = useContext(ChatContext);
  const { token } = theme.useToken();
  const middlewareList = getMiddlewareList();
  const onChange = useCallback(
    (checked: boolean, middleware: IMiddleware) => {
      setMiddlewares((v) => {
        v = v.filter((f) => f != middleware.key);
        if (checked) {
          v.push(middleware.key);
        }
        return v;
      });
      if (middleware.setting) {
        let nextSettings = inputSettings;
        if (checked) {
          nextSettings = [
            ...(middleware.setting?.map((v) => ({
              ...v,
              key: getUuid(),
              ctx: v.ctx.map((c) => ({ ...c, key: getUuid() })),
            })) || []),
            ...inputSettings,
          ];
        } else {
          nextSettings = inputSettings?.filter(
            (f) => f.extensionId != middleware.key
          );
        }
        changeSetting(nextSettings);
      }
    },
    [changeSetting, inputSettings, setMiddlewares]
  );
  return (
    <>
      {middlewareList.map((item) => {
        return (
          <div
            key={item.key}
            style={{
              borderRadius: 8,
              border: "1px solid " + token.colorBorder,
              padding: 5,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                borderBottom: "1px solid #ccc2",
                paddingBottom: 2,
                display: "flex",
              }}
            >
              <Typography.Text ellipsis style={{ width: "100%" }}>
                {item.tags.slice(0, Math.min(item.tags.length, 3)).map((v) => (
                  <Tag key={"middleware_tag_" + v} color="green">
                    {v}
                  </Tag>
                ))}
                <span>{item.name}</span>
              </Typography.Text>
              <Switch
                checked={middlewares.includes(item.key)}
                onChange={(e) => {
                  onChange(e, item);
                }}
              />
            </div>
            <Typography.Paragraph
              style={{ width: "100%" }}
              type="secondary"
              ellipsis={{ rows: 2, expandable: true, symbol: "more" }}
            >
              {item.description}
            </Typography.Paragraph>
          </div>
        );
      })}
    </>
  );
};
