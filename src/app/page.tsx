import Sidebar from '@/components/Sidebar';
import Editor from '@/components/Editor';

export default function Home() {
  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar />
      <Editor />
    </div>
  );
}
