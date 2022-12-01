import Link, { LinkProps } from "next/link";
import { useRouter } from "next/router";
import React, { Children } from "react";
import cx from "classnames";

type NavLinkProps = React.PropsWithChildren<LinkProps> & {
  activeClassName?: string;
};

export function NavLink({
  children,
  activeClassName = "selected",
  ...props
}: NavLinkProps) {
  const { asPath } = useRouter();
  const child = Children.only(children) as React.ReactElement;
  const childClassName = child.props.className || "";

  const isActive = asPath === props.href || asPath === props.as;

  const className = cx(childClassName, { [activeClassName]: isActive });

  return (
    <Link {...props}>
      {React.cloneElement(child, {
        className: className || null,
      })}
    </Link>
  );
}
