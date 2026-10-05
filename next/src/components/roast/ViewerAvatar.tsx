import * as React from 'react';
import {UserResDto} from '@/client/nest';

interface ViewerAvatarProps {
  user: UserResDto;
  className: string;
}

// The user's photo, or the first letter of their name while they have none
export default function ViewerAvatar({ user, className }: ViewerAvatarProps) {
  const name = user.firstName || user.username;

  if (user.avatar) {
    // The avatar is served as it was uploaded, outside the image optimizer
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatar} alt={name} className={className} referrerPolicy="no-referrer" />;
  }
  return (
    <span className={className} aria-label={name}>
      {name[0].toUpperCase()}
    </span>
  );
}
