import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 16, ...props }: Props) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 20 20",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    focusable: false,
    ...props,
  };
}

export function IconeBusca(props: Props) {
  return (
    <svg {...base(props)}>
      <circle cx="8.6" cy="8.6" r="5.1" />
      <path d="m12.5 12.5 4 4" />
    </svg>
  );
}

export function IconeMais(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

export function IconeSeta(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 10h13M11.5 5l5 5-5 5" />
    </svg>
  );
}

export function IconeVoltar(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M16.5 10h-13M8.5 5l-5 5 5 5" />
    </svg>
  );
}

export function IconeAtualizar(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M16 8.2A6.4 6.4 0 0 0 4.4 6M4 11.8A6.4 6.4 0 0 0 15.6 14" />
      <path d="M16 4v4.2h-4.2M4 16v-4.2h4.2" />
    </svg>
  );
}

export function IconeEditar(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M4 16h3.2L16 7.2 12.8 4 4 12.8V16Z" />
      <path d="m11.4 5.4 3.2 3.2" />
    </svg>
  );
}

export function IconeExcluir(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M3.8 6h12.4M7.5 6V3.8h5V6M5.6 6l.8 10.2h7.2L14.4 6" />
      <path d="M8.6 9v4.2M11.4 9v4.2" />
    </svg>
  );
}

export function IconeExterno(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M11 3.8h5.2V9M16.2 3.8 9.4 10.6" />
      <path d="M14 11.5v4.7H3.8V6.2h4.6" />
    </svg>
  );
}

export function IconeFechar(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

export function IconeCheck(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="m4 10.4 3.7 3.6L16 5.4" />
    </svg>
  );
}

export function IconeAlerta(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M10 3.2 18 17H2L10 3.2Z" />
      <path d="M10 8v4M10 14.6v.1" />
    </svg>
  );
}

export function IconeInfo(props: Props) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="10" r="7.4" />
      <path d="M10 9.2v4.4M10 6.6v.1" />
    </svg>
  );
}

export function IconeSetaBaixo(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M5.5 8 10 12.5 14.5 8" />
    </svg>
  );
}
