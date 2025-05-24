type ImageProps = {
  src: string;
};

const Image = (props: ImageProps) => (
  <img className="w-full h-full object-contain" src={props.src} />
);

export { Image };
