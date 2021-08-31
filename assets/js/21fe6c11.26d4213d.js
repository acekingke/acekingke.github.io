"use strict";(self.webpackChunkmy_website=self.webpackChunkmy_website||[]).push([[290],{3905:function(e,n,t){t.d(n,{Zo:function(){return p},kt:function(){return d}});var r=t(7294);function o(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function c(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}function i(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?c(Object(t),!0).forEach((function(n){o(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):c(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function a(e,n){if(null==e)return{};var t,r,o=function(e,n){if(null==e)return{};var t,r,o={},c=Object.keys(e);for(r=0;r<c.length;r++)t=c[r],n.indexOf(t)>=0||(o[t]=e[t]);return o}(e,n);if(Object.getOwnPropertySymbols){var c=Object.getOwnPropertySymbols(e);for(r=0;r<c.length;r++)t=c[r],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(o[t]=e[t])}return o}var l=r.createContext({}),u=function(e){var n=r.useContext(l),t=n;return e&&(t="function"==typeof e?e(n):i(i({},n),e)),t},p=function(e){var n=u(e.components);return r.createElement(l.Provider,{value:n},e.children)},s={inlineCode:"code",wrapper:function(e){var n=e.children;return r.createElement(r.Fragment,{},n)}},f=r.forwardRef((function(e,n){var t=e.components,o=e.mdxType,c=e.originalType,l=e.parentName,p=a(e,["components","mdxType","originalType","parentName"]),f=u(t),d=o,g=f["".concat(l,".").concat(d)]||f[d]||s[d]||c;return t?r.createElement(g,i(i({ref:n},p),{},{components:t})):r.createElement(g,i({ref:n},p))}));function d(e,n){var t=arguments,o=n&&n.mdxType;if("string"==typeof e||o){var c=t.length,i=new Array(c);i[0]=f;var a={};for(var l in n)hasOwnProperty.call(n,l)&&(a[l]=n[l]);a.originalType=e,a.mdxType="string"==typeof e?e:o,i[1]=a;for(var u=2;u<c;u++)i[u]=t[u];return r.createElement.apply(null,i)}return r.createElement.apply(null,t)}f.displayName="MDXCreateElement"},3125:function(e,n,t){t.r(n),t.d(n,{frontMatter:function(){return a},contentTitle:function(){return l},metadata:function(){return u},toc:function(){return p},default:function(){return f}});var r=t(7462),o=t(3366),c=(t(7294),t(3905)),i=["components"],a={},l="\u5e38\u7528Shell\u547d\u4ee4",u={unversionedId:"\u5b66\u4e60\u8d44\u6599/\u5e38\u7528shell",id:"\u5b66\u4e60\u8d44\u6599/\u5e38\u7528shell",isDocsHomePage:!1,title:"\u5e38\u7528Shell\u547d\u4ee4",description:"find \u4e0egrep\u4e00\u8d77\u4f7f\u7528",source:"@site/docs/\u5b66\u4e60\u8d44\u6599/\u5e38\u7528shell.md",sourceDirName:"\u5b66\u4e60\u8d44\u6599",slug:"/\u5b66\u4e60\u8d44\u6599/\u5e38\u7528shell",permalink:"/docs/\u5b66\u4e60\u8d44\u6599/\u5e38\u7528shell",editUrl:"https://github.com/acekingke/doc_site/edit/main/docs/\u5b66\u4e60\u8d44\u6599/\u5e38\u7528shell.md",version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Effecicent Computation of LALR(1) look-Ahead Sets",permalink:"/docs/\u5b66\u4e60\u8d44\u6599/EfLALR"}},p=[{value:"find \u4e0egrep\u4e00\u8d77\u4f7f\u7528",id:"find-\u4e0egrep\u4e00\u8d77\u4f7f\u7528",children:[]},{value:"ubuntu\u5b89\u88c5go\u811a\u672c",id:"ubuntu\u5b89\u88c5go\u811a\u672c",children:[]}],s={toc:p};function f(e){var n=e.components,t=(0,o.Z)(e,i);return(0,c.kt)("wrapper",(0,r.Z)({},s,t,{components:n,mdxType:"MDXLayout"}),(0,c.kt)("h1",{id:"\u5e38\u7528shell\u547d\u4ee4"},"\u5e38\u7528Shell\u547d\u4ee4"),(0,c.kt)("h2",{id:"find-\u4e0egrep\u4e00\u8d77\u4f7f\u7528"},"find \u4e0egrep\u4e00\u8d77\u4f7f\u7528"),(0,c.kt)("pre",null,(0,c.kt)("code",{parentName:"pre"},'find . -type f -name "" -exec grep --color -nH --null -e "hello" \\{\\} +\n')),(0,c.kt)("h2",{id:"ubuntu\u5b89\u88c5go\u811a\u672c"},"ubuntu\u5b89\u88c5go\u811a\u672c"),(0,c.kt)("pre",null,(0,c.kt)("code",{parentName:"pre"},'\n#!/bin/bash\napt update\napt install wget curl -y\nbash\ncd \n\necho "1. install go"\ncd ~ \\\n&& wget https://studygolang.com/dl/golang/go1.16.7.linux-amd64.tar.gz -O go16.7.linux-amd64.tar.gz \\\n&& tar -C ~/ -xzf go16.7.linux-amd64.tar.gz \\\n&& rm -f ~/go16.7.linux-amd64.tar.gz\n\necho "2. set env"\ncd ~\nmkdir ~/gopath\necho \'export GOPROXY=https://goproxy.io\' >> ~/.bashrc\necho \'export GOPATH=~/gopath\' >> ~/.bashrc\necho \'export PATH=$PATH:~/go/bin:$GOPATH/bin\' >> ~/.bashrc\nsource ~/.bashrc\n\necho "3. check go app"\ngo version\n\necho "4. check go env"\ngo env\n\necho "5. create go source file"\ncd ~\ntee ./hello.go <<-\'EOF\'\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello world!")\n}\nEOF\n\necho "6. run hello.go"\ngo run hello.go\n\necho "go1.16 install and check finished"\n')))}f.isMDXComponent=!0}}]);