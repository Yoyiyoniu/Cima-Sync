import { SVGProps } from "react"
const CoffeeIcon = (props: SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={24}
        height={24}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        className="icon icon-tabler icons-tabler-outline icon-tabler-coffee"
        {...props}
    >
        <path stroke="none" d="M0 0h24v24H0z" />
        <path d="M3 14c.83.642 2.077 1.017 3.5 1 1.423.017 2.67-.358 3.5-1 .83-.642 2.077-1.017 3.5-1 1.423-.017 2.67.358 3.5 1M8 3a2.4 2.4 0 0 0-1 2 2.4 2.4 0 0 0 1 2M12 3a2.4 2.4 0 0 0-1 2 2.4 2.4 0 0 0 1 2" />
        <path d="M3 10h14v5a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6v-5z" />
        <path d="M16.746 16.726a3 3 0 1 0 .252-5.555" />
    </svg>
)
export default CoffeeIcon
