import styles from "./TextInput.module.scss";

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  type?: "text" | "password" | "email";
  required?: boolean;
  value?: string;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const TextInput: React.FC<TextInputProps> = ({
  id,
  className,
  type = "text",
  required = false,
  value,
  onChange,
  ...props
}) => {
  return (
    <input
      className={`${styles.TextInput} ${className ? className : ""}`}
      placeholder={props?.placeholder}
      id={id}
      name={id}
      type={type}
      required={required}
      value={value}
      onChange={onChange}
    />
  );
};
