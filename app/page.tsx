"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import "./../app/app.css";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react"; // 追加
import { useAuthenticator } from "@aws-amplify/ui-react";
import { QRCodeCanvas } from "qrcode.react";
import { getCurrentUser, fetchAuthSession } from '@aws-amplify/auth';

Amplify.configure(outputs);

const client = generateClient<Schema>();

function UserCard() {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [name, setName] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const fetchUserAttributes = async () => {
      try {
        const user = await getCurrentUser();
        const session = await fetchAuthSession();

        console.log("✅ current user from Auth:", user);

        const nameAttr =
          (session as any)?.tokens?.idToken?.payload?.name ||
          (session as any)?.tokens?.idToken?.payload?.email ||
          (user as any)?.signInDetails?.loginId ||
          "";
        const userId = user.username;
        const email = (session as any)?.tokens?.idToken?.payload?.email ?? "";

        setName(nameAttr);
        setUserId(userId);

        console.log("✅ setName:", nameAttr);
        console.log("✅ setUserId:", userId);

        try {
          await client.models.User.create({
            id: userId,
            userName: nameAttr,
            email: email,
          });
          console.log("✅ User モデルに保存完了");
        } catch (err) {
          console.warn("⚠️ Userモデルの保存に失敗しました（重複の可能性あり）", err);
        }
      } catch (err) {
        console.error("❌ ユーザー属性の取得に失敗しました", err);
      }
    };

    fetchUserAttributes();
  }, []);

  return (
    <main style={{ padding: 30, textAlign: "center" }}>
      <h2>{name} さんのデジタル会員証</h2>
      <div style={{ display: "flex", justifyContent: "center", margin: "1rem auto" }}>
        <QRCodeCanvas value={userId} size={200} />
      </div>
      <p>※船長にこのQRコードを提示してください</p>
      <button onClick={signOut}>ログアウト</button>
    </main>
  );
}

export default function App() {
  return (
    <Authenticator.Provider>
      <Authenticator>
        <UserCard />
      </Authenticator>
    </Authenticator.Provider>
  );
}

// export default function App() {
//   const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

//   function listTodos() {
//     client.models.Todo.observeQuery().subscribe({
//       next: (data) => setTodos([...data.items]),
//     });
//   }

//   useEffect(() => {
//     listTodos();
//   }, []);

//   function createTodo() {
//     client.models.Todo.create({
//       content: window.prompt("Todo content"),
//     });
//   }

//   return (
//     <main>
//       <Authenticator.Provider>
//         <Authenticator>
//         </Authenticator>
//       </Authenticator.Provider>
//       <h1>My todos</h1>
//       <button onClick={createTodo}>+ new</button>
//       <ul>
//         {todos.map((todo) => (
//           <li key={todo.id}>{todo.content}</li>
//         ))}
//       </ul>
//       <div>
//         🥳 App successfully hosted. Try creating a new todo.
//         <br />
//         <a href="https://docs.amplify.aws/nextjs/start/quickstart/nextjs-app-router-client-components/">
//           Review next steps of this tutorial.
//         </a>
//       </div>
//     </main>
//   );
// }
