"use client";

import React from "react";
import styled from "styled-components";

const BaseButton = styled.button`
  text-align: center;
  color: black;
  width: 100%;
  min-width: 100px;
  background: yellow;
`;

const ButtonPrimary = styled(BaseButton)`
  background: yellow;
`;

const buttonStyleLists = {
    default: BaseButton,
    primary: ButtonPrimary,
  };

  type DeliveryButtonProps = {
    styleType?: keyof typeof buttonStyleLists; // "default" | "primary"
    onClick?: () => void;
    children: React.ReactNode;
  };

  const DeliveryButton: React.FC<DeliveryButtonProps> = ({ styleType = "default", onClick, children }) => {
    console.log("DeliveryButton rendering", { styleType, children });
    const Component = buttonStyleLists[styleType] || buttonStyleLists.default;
    return <Component onClick={onClick}>{children}</Component>;
  };
  
  export default DeliveryButton;