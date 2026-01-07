import Navbar from "@/components/Navbar";

export default function VibeMarketLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Navbar />
            <main className="pt-28">
                {children}
            </main>
        </>
    );
}
