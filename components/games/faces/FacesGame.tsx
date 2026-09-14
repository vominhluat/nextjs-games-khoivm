"use client";

import { useState } from "react";
import styles from "./FacesGame.module.css";

const INITIAL_FACES = [true, false, true, false];

export default function FacesGame() {
  const [faces, setFaces] = useState(INITIAL_FACES);
  const [moves, setMoves] = useState(0);
  const won = faces.every(Boolean);

  function flipFace(selectedIndex: number) {
    if (won) return;

    setFaces((current) =>
      current.map((isHappy, index) =>
        Math.abs(index - selectedIndex) <= 1 ? !isHappy : isHappy,
      ),
    );
    setMoves((current) => current + 1);
  }

  function restart() {
    setFaces(INITIAL_FACES);
    setMoves(0);
  }

  return (
    <section className={styles.game} aria-labelledby="faces-title">
      <div className={styles.glow} aria-hidden="true" />
      <header className={styles.header}>
        <p className={styles.eyebrow}>Trò chơi suy luận</p>
        <h1 id="faces-title">Faces</h1>
        <p className={styles.subtitle}>
          Chạm vào một khuôn mặt để đổi biểu cảm của nó và các mặt ngay bên cạnh.
        </p>
      </header>

      <div className={styles.statusBar} aria-live="polite">
        <span>Lượt chơi</span>
        <strong>{moves}</strong>
      </div>

      <section className={styles.instructions} aria-labelledby="how-to-play">
        <div className={styles.instructionsHeading}>
          <span aria-hidden="true">💡</span>
          <div>
            <h2 id="how-to-play">Luật chơi</h2>
            <p>Đưa cả 4 khuôn mặt về trạng thái cười.</p>
          </div>
        </div>
        <ul>
          <li>
            <strong>Chọn mặt số 1 hoặc 4:</strong> mặt được chọn và 1 mặt liền
            kề sẽ đổi biểu cảm.
          </li>
          <li>
            <strong>Chọn mặt số 2 hoặc 3:</strong> mặt được chọn và 2 mặt liền
            kề sẽ đổi biểu cảm.
          </li>
          <li>
            Mỗi mặt sẽ đổi qua lại giữa <strong>cười</strong> và
            <strong> mếu</strong>. Bạn có thể nhấp chuột, chạm màn hình hoặc dùng
            phím Tab rồi Enter/Space.
          </li>
        </ul>
      </section>

      <div className={styles.board} aria-label="Bốn khuôn mặt">
        {faces.map((isHappy, index) => (
          <button
            type="button"
            className={`${styles.faceButton} ${isHappy ? styles.happy : styles.sad}`}
            key={index}
            onClick={() => flipFace(index)}
            aria-label={`Mặt số ${index + 1}: ${isHappy ? "đang cười" : "đang mếu"}`}
            disabled={won}
          >
            <span className={styles.face} aria-hidden="true">
              <span className={styles.eyes}>
                <i />
                <i />
              </span>
              <span className={styles.mouth} />
            </span>
            <span className={styles.faceNumber}>{index + 1}</span>
          </button>
        ))}
      </div>

      {won ? (
        <div className={styles.winMessage} role="status">
          <span aria-hidden="true">🎉</span>
          <div>
            <strong>Bạn thắng rồi!</strong>
            <p>Cả bốn khuôn mặt đều đang cười sau {moves} lượt.</p>
          </div>
        </div>
      ) : (
        <p className={styles.hint}>Mục tiêu: biến cả 4 khuôn mặt thành mặt cười.</p>
      )}

      <button type="button" className={styles.restart} onClick={restart}>
        {won ? "Chơi lại" : "Bắt đầu lại"}
      </button>
    </section>
  );
}
