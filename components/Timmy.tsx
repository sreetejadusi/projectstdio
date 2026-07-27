'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export interface TimmyProps {
  shirtColor: string;
}

// Timmy needs to expose refs for animations, so we use forwardRef
export interface TimmyHandle {
  wave: () => Promise<void>;
  jump: () => Promise<void>;
  walkRight: () => Promise<void>;
}

export const Timmy = React.forwardRef<TimmyHandle, TimmyProps>(({ shirtColor }, ref) => {
  const localRef = useRef<SVGSVGElement>(null);

  React.useImperativeHandle(ref, () => ({
    wave: () => {
      return new Promise<void>((resolve) => {
        const rightArm = localRef.current?.querySelector('.right-arm-group');
        if (rightArm) {
          gsap.to(rightArm, {
            rotation: -45,
            yoyo: true,
            repeat: 3,
            duration: 0.2,
            transformOrigin: '147px 111px',
            onComplete: () => {
              gsap.to(rightArm, { rotation: 0, duration: 0.2 });
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    },
    jump: () => {
      return new Promise<void>((resolve) => {
        const body = localRef.current?.querySelector('.timmy-body');
        if (body) {
          gsap.to(body, {
            y: -50,
            yoyo: true,
            repeat: 1,
            duration: 0.3,
            ease: 'power1.inOut',
            onComplete: resolve
          });
        } else {
          resolve();
        }
      });
    },
    walkRight: () => {
      return new Promise<void>((resolve) => {
        if (localRef.current) {
          gsap.to(localRef.current, {
            x: '+=50',
            duration: 0.5,
            ease: 'power1.inOut',
            onComplete: resolve
          });
        } else {
          resolve();
        }
      });
    }
  }));

  return (
    <svg ref={localRef} width="220" height="340" viewBox="0 0 220 340" xmlns="http://www.w3.org/2000/svg" className="timmy-svg overflow-visible relative transition-all duration-300">
      <g className="timmy-body">
        {/* Head */}
        <circle id="head" cx="110" cy="60" r="35" fill="#F6C89F" />

        {/* Hair */}
        <path id="hair" d="M75 55 Q110 10 145 55 L145 40 Q110 0 75 40Z" fill="#2D2D2D" />

        {/* Eyes */}
        <circle cx="97" cy="60" r="3" fill="#222" />
        <circle cx="123" cy="60" r="3" fill="#222" />

        {/* Smile */}
        <path d="M98 75 Q110 84 122 75" stroke="#444" strokeWidth="2" fill="none" strokeLinecap="round" />

        {/* Neck */}
        <rect x="104" y="92" width="12" height="10" fill="#F6C89F" />

        {/* Shirt */}
        <rect id="shirt" x="75" y="100" width="70" height="70" rx="12" fill={shirtColor} className="transition-colors duration-300" />

        {/* Left Arm */}
        <g id="leftArmGroup">
          <rect id="leftArm" x="48" y="105" width="25" height="12" rx="6" fill="#F6C89F" />
          <circle cx="48" cy="111" r="8" fill="#F6C89F" />
        </g>

        {/* Right Arm Group - for waving */}
        <g id="rightArmGroup" className="right-arm-group" style={{ transformOrigin: '147px 111px' }}>
          <rect id="rightArm" x="147" y="105" width="25" height="12" rx="6" fill="#F6C89F" />
          <circle cx="172" cy="111" r="8" fill="#F6C89F" />
        </g>

        {/* Pants */}
        <rect id="pants" x="78" y="170" width="64" height="55" rx="8" fill="#2F3E5C" />

        {/* Left Leg */}
        <rect id="leftLeg" x="88" y="225" width="12" height="55" rx="6" fill="#2F3E5C" />

        {/* Right Leg */}
        <rect id="rightLeg" x="120" y="225" width="12" height="55" rx="6" fill="#2F3E5C" />

        {/* Shoes */}
        <ellipse id="leftShoe" cx="94" cy="287" rx="14" ry="7" fill="#444" />
        <ellipse id="rightShoe" cx="126" cy="287" rx="14" ry="7" fill="#444" />
      </g>
    </svg>
  );
});

Timmy.displayName = 'Timmy';
