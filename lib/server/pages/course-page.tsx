import * as React from 'react'
import {
  DocumentRenderer,
  DocumentRendererProps,
} from '@keystone-6/document-renderer'
import {
  buildHeroConfig,
  type CourseData,
  type LessonProgressMap,
} from '@/types/course'
import { CopyableCodeBlock } from '@/ui/copyable-code-block'
import { CourseHero } from '@/ui/course-hero'
import { CourseTOC } from '@/ui/course-toc'
import { ProseContent } from '@/ui/prose-content'
import { TrustedHtmlBlock } from '@/ui/trusted-html-block'

export async function CoursePageRenderer({
  courseData,
  isAuthenticated,
  progressMap,
  hasActiveMembership = false,
}: {
  courseData: CourseData
  isAuthenticated?: boolean
  progressMap?: LessonProgressMap
  hasActiveMembership?: boolean
}) {
  // Reason: heroEnabled is now on the Course entity; build config only when enabled and a hero is linked.
  const heroConfig =
    courseData.heroEnabled && courseData.hero
      ? buildHeroConfig(courseData.hero)
      : null

  const renderers: DocumentRendererProps['renderers'] = {
    block: {
      heading({ level, children, textAlign }) {
        const Comp = `h${level}` as const
        return (
          <Comp style={{ textAlign }} className="text-pretty">
            {children}
          </Comp>
        )
      },
      blockquote(props) {
        return <blockquote className="text-accent mb-4" {...props} />
      },
      paragraph(props) {
        return <p {...props} />
      },
      code({ children }) {
        return <CopyableCodeBlock>{children}</CopyableCodeBlock>
      },
    },
  }

  return (
    <>
      {heroConfig && <CourseHero config={heroConfig} />}

      {(courseData.chapters?.length > 0 || courseData.pages?.length > 0) && (
        <CourseTOC
          title={courseData.title}
          chapters={courseData.chapters ?? []}
          pages={courseData.pages ?? []}
          courseSlug={courseData.slug}
          isAuthenticated={isAuthenticated}
          progressMap={progressMap}
          hasActiveMembership={hasActiveMembership}
        />
      )}

      {(courseData.trustedHtml || courseData.content?.document) && (
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-10">
          {courseData.trustedHtml ? (
            <ProseContent>
              {courseData.customCss && (
                <style
                  dangerouslySetInnerHTML={{ __html: courseData.customCss }}
                />
              )}
              <TrustedHtmlBlock html={courseData.trustedHtml} />
            </ProseContent>
          ) : (
            courseData.content?.document && (
              <ProseContent>
                <DocumentRenderer
                  document={
                    courseData.content
                      .document as DocumentRendererProps['document']
                  }
                  renderers={renderers}
                />
              </ProseContent>
            )
          )}
        </div>
      )}
    </>
  )
}
