import React from 'react';
import { TypingUser } from '../types';

interface Props {
  typingUsers: TypingUser[];
}

export const ChatTypingIndicator: React.FC<Props> = ({ typingUsers }) => {
  if (!typingUsers || typingUsers.length === 0) {
    return <div className="chat-typing-bar" style={{ visibility: 'hidden' }}>&nbsp;</div>;
  }

  const names = typingUsers.map((u) => u.userName);
  let label = '';
  if (names.length === 1) {
    label = `${names[0]} is typing…`;
  } else if (names.length === 2) {
    label = `${names[0]} and ${names[1]} are typing…`;
  } else {
    label = `${names[0]} and ${names.length - 1} other riders are typing…`;
  }

  return (
    <div className="chat-typing-bar">
      <div className="typing-dots">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      <span>{label}</span>
    </div>
  );
};
