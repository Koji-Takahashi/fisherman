"use client";

import { useRef, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Html5Qrcode } from "html5-qrcode";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import { Authenticator } from "@aws-amplify/ui-react";
// import awsExports from "../../aws-exports";
// import { createScanRecord } from "../mutations";

// Amplify.configure(awsExports);
Amplify.configure(outputs);

function ScanPage() {
  const client = generateClient<Schema>();
  console.log("📦 client.models:", client.models);
  const [result, setResult] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");
  const [scanning, setScanning] = useState<boolean>(false);
  const readerId = "reader";
  const qrCodeScannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = () => {
    setScanning(true);
    const scanner = new Html5Qrcode(readerId);
    qrCodeScannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          setResult(decodedText);
          console.log("✅ QRコードの読み取り成功:", decodedText);
          console.log("📌 読み取ったID（decodedText）:", decodedText);
          setStatus("読み取り成功！保存中...");

          let userName = "";
          let email = "";

          try {
            const userResult = await client.models.User.get({ id: decodedText });
            // const userResult = await client.models.User.list();
  
            if (userResult?.data) {
              const user = userResult.data;
              userName = user.userName ?? "";
              email = user.email ?? "";
              console.log("✅ ユーザー情報取得成功:", user);
              console.log("📌 ユーザー取得結果（userResult）:", userResult);
            }
          } catch (err) {
            console.warn("ユーザー情報の取得に失敗しました", err);
          }

          const record = {
            userId: decodedText,
            timestamp: Date.now(),
          };
          console.log("📌 作成予定のScanRecordデータ:", record);

          try {
            const response = await client.models.ScanRecord.create(record);
            console.log("📌 ScanRecord 作成結果:", response);
            console.log("保存成功:", response);
            setStatus("✅ データ保存が完了しました");
          } catch (err) {
            console.error("保存失敗:", err);
            setStatus("❌ データ保存に失敗しました");
          }

          scanner.stop().then(() => {
            setScanning(false);
          });
        },
        (errorMessage) => {
          console.warn("QRコード読み取りエラー:", errorMessage);
        }
      )
      .catch((err) => {
        console.error("カメラの起動に失敗しました:", err);
        setScanning(false);
      });
  };

  return (
    <main style={{ textAlign: "center", padding: "2rem" }}>
        
      <h2>【船長用】QRコード読み取り</h2>
      <p>お客様のデジタル会員証を読み取ってください</p>

      {!scanning && !result && (
        <button onClick={startScanner}>スキャンを開始する</button>
      )}

      <div id={readerId} style={{ margin: "1rem auto", width: "100%", maxWidth: 400 }} />

      {result && (
        <div style={{ marginTop: "1rem" }}>
          <h3>読み取り結果：</h3>
          <p>{result}</p>
          <p>{status}</p>
        </div>
      )}
    </main>
  );
}

export default function ScanPageWithAuth() {
  return (
    <Authenticator.Provider>
      <Authenticator>
        <ScanPage />
      </Authenticator>
    </Authenticator.Provider>
  );
}
