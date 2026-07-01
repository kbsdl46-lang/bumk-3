import type { ReactNode } from "react";

type PageSectionProps = {
  title: string;
  description: string;
  items: string[];
  children?: ReactNode;
};

export function PageSection({ title, description, items, children }: PageSectionProps) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <ul className="task-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {children}
    </section>
  );
}
