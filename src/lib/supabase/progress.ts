import { createSupabaseClient } from './client'

export type UserProgress = {
  lesson_slug: string
  section_slug: string
  completed: boolean
  score: number
  is_perfect: boolean
}

export async function saveQuizProgress(
  lessonSlug: string,
  sectionSlug: string,
  score: number
): Promise<boolean> {
  const supabase = createSupabaseClient()
  const isPerfect = score === 100

  const { error } = await supabase
    .from('user_progress')
    .upsert({
      lesson_slug: lessonSlug,
      section_slug: sectionSlug,
      completed: true,
      score,
      is_perfect: isPerfect,
    })

  if (error) {
    console.error('Failed to save progress:', error)
    return false
  }
  return true
}

export async function getLessonProgress(lessonSlug: string) {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('user_progress')
    .select('score, is_perfect, completed')
    .eq('lesson_slug', lessonSlug)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error(error)
  }
  
  return data || null
}