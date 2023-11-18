import React, { useRef, useState } from "react";
import {
  ProDescriptionsActionType,
} from "@ant-design/pro-components";
import { createFromIconfontCN } from '@ant-design/icons';


import {
  Button,
  Drawer,
  Space,
} from "antd";
import {
  UserOutlined,
} from "@ant-design/icons";
import {
  ProLayout,
  DefaultFooter, ProConfigProvider,
  PageContainer,
} from "@ant-design/pro-components";

const routes = [
  {
    path: "/",
    name: "Home",
    menuName: "Name2"
  },
  {
    path: "/datqa",
    name: "data_hui",
    routes: [
      {
        menuName: "g1",
        name: "域买家维度交易",
        path: "/xx",
        routes: [
          {
            id: 2,
            name: "月表",
            path: "/data_hui2",
          },
          {
            name: "日表",
            path: "/data",
          },
        ],
      },
    ],
  },
];

const IconFont = createFromIconfontCN({
  scriptUrl: [
    '//at.alicdn.com/t/font_1788044_0dwu4guekcwr.js', // icon-javascript, icon-java, icon-shoppingcart (overridden)
    '//at.alicdn.com/t/font_1788592_a5xf2bdic3u.js', // icon-shoppingcart, icon-python
  ],
});
const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);
  const [menu, setMenu] = useState(true);
  const [header, setHeader] = useState(true);
  const [footer, setFooter] = useState(true);
  const [menuHeader, setMenuHeader] = useState(true);
  const [right, setRight] = useState(true);
  const [pure, setPure] = useState(false);
  const [collapsedButtonRender, setCollapsedButtonRender] = useState(true);

  const ref = React.useRef(null);
  const [pathname, setPathname] = useState("/home");

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };
  const actionRef = useRef<ProDescriptionsActionType>();

  return (
    <div
      style={{
        height: "100vh",
      }}
    >
      <ProConfigProvider dark={true}>

        <ProLayout
          location={{
            pathname: pathname,
          }}
          menuItemRender={(item, dom) => (
            <a
              onClick={() => {
                setPathname(item.path || '/welcome');
              }}
            >
              {dom}
            </a>
          )}
          iconfontUrl={"//at.alicdn.com/t/font_1039637_btcrd5co4w.js"}
          avatarProps={{
            icon: <UserOutlined />,
          }}
          style={{
            height: "100vh",
          }}
          siderWidth={256}

          footerRender={() => (
            <DefaultFooter
              links={[
                {
                  key: "Ant Design Pro",
                  title: "Ant Design Pro",
                  href: "https://pro.ant.design",
                  blankTarget: true,
                },
              ]}
            />
          )}
        >
          <PageContainer
            style={{ height: "80vh" }}
            content="欢迎使用 ProLayout 组件"
            tabList={[
              {
                tab: 't1',
                key: 'base',
              },
              {
                tab: 't2',
                key: 'info',
              },
            ]}
            extra={[
              <Button onClick={() => setOpen(true)} key="3">debug</Button>,
            ]}

          >
          </PageContainer>
        </ProLayout>
        <Drawer
          title="Create a new account"
          width={720}
          onClose={onClose}
          open={open}
          styles={{
            body: {
              paddingBottom: 80,
            },
          }}
          extra={
            <Space>
              <Button onClick={onClose}>Cancel</Button>
              <Button onClick={onClose} type="primary">
                Submit
              </Button>
            </Space>
          }
        ></Drawer>
      </ProConfigProvider>
    </div >
  );
};

export default App;
