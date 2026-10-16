import { Link, useLocation, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { findScene } from '../data/scenes'
import VocabDictionary from '../components/VocabDictionary'
import VocabPractice from '../components/VocabPractice'
import SceneGallery from '../components/SceneGallery'
import SceneView from '../components/SceneView'
import { usePageMeta } from '../hooks/usePageMeta'

type Tab = 'dict' | 'scenes' | 'practice'

const TABS: { key: Tab; to: string }[] = [
  { key: 'dict', to: '/vocab' },
  { key: 'scenes', to: '/vocab/scenes' },
  { key: 'practice', to: '/vocab/practice' },
]

function Shell({ tab, children }: { tab: Tab; children: React.ReactNode }) {
  const { t } = useTranslation()
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-bold">{t('vocab.title')}</h1>
        <nav className="seg-group">
          {TABS.map((x) => (
            <Link key={x.key} to={x.to} className={tab === x.key ? 'seg-on' : 'seg-off'}>
              {t(`vocab.tab.${x.key}`)}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  )
}

function DictPage({ zhFirst }: { zhFirst: boolean }) {
  usePageMeta('/vocab')
  return (
    <Shell tab="dict">
      <VocabDictionary zhFirst={zhFirst} />
    </Shell>
  )
}

function PracticePage({ zhFirst }: { zhFirst: boolean }) {
  usePageMeta('/vocab/practice')
  return (
    <Shell tab="practice">
      <VocabPractice zhFirst={zhFirst} />
    </Shell>
  )
}

function ScenesPage() {
  usePageMeta('/vocab/scenes')
  return (
    <Shell tab="scenes">
      <SceneGallery />
    </Shell>
  )
}

export default function Vocab() {
  const { i18n } = useTranslation()
  const zhFirst = (i18n.resolvedLanguage ?? 'en').startsWith('zh')
  const { pathname } = useLocation()
  const { scene: sceneId } = useParams()

  if (pathname.startsWith('/vocab/practice')) return <PracticePage zhFirst={zhFirst} />
  if (pathname.startsWith('/vocab/scenes')) {
    const scene = findScene(sceneId)
    if (scene) {
      return (
        <Shell tab="scenes">
          <SceneView scene={scene} zhFirst={zhFirst} />
        </Shell>
      )
    }
    return <ScenesPage />
  }
  return <DictPage zhFirst={zhFirst} />
}
