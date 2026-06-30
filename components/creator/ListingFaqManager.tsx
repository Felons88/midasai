"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { GripVertical, Plus, Trash2 } from "lucide-react"

export interface FaqRow {
  id: string
  question: string
  answer: string
  sort_order: number
  published: boolean
}

interface ListingFaqManagerProps {
  listingId: string
  initialFaqs: FaqRow[]
}

export function ListingFaqManager({ listingId, initialFaqs }: ListingFaqManagerProps) {
  const [faqs, setFaqs] = useState(initialFaqs)
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function addFaq() {
    if (!question.trim() || !answer.trim()) {
      setError("Question and answer are required.")
      return
    }

    setSaving(true)
    setError(null)
    const supabase = createClient()
    const sortOrder = faqs.length > 0 ? Math.max(...faqs.map((f) => f.sort_order)) + 1 : 0

    const { data, error: insertError } = await supabase
      .from("listing_faqs")
      .insert({
        listing_id: listingId,
        question: question.trim(),
        answer: answer.trim(),
        sort_order: sortOrder,
        published: true,
      })
      .select("id, question, answer, sort_order, published")
      .single()

    setSaving(false)

    if (insertError || !data) {
      setError(insertError?.message ?? "Failed to add FAQ.")
      return
    }

    setFaqs((prev) => [...prev, data])
    setQuestion("")
    setAnswer("")
  }

  async function togglePublished(faq: FaqRow) {
    const supabase = createClient()
    const { data, error: updateError } = await supabase
      .from("listing_faqs")
      .update({ published: !faq.published, updated_at: new Date().toISOString() })
      .eq("id", faq.id)
      .select("id, question, answer, sort_order, published")
      .single()

    if (updateError || !data) {
      setError(updateError?.message ?? "Failed to update FAQ.")
      return
    }

    setFaqs((prev) => prev.map((item) => (item.id === faq.id ? data : item)))
  }

  async function deleteFaq(faqId: string) {
    const supabase = createClient()
    const { error: deleteError } = await supabase.from("listing_faqs").delete().eq("id", faqId)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setFaqs((prev) => prev.filter((item) => item.id !== faqId))
  }

  return (
    <div className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-lg text-text-primary">Add FAQ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="faq-question">Question</Label>
            <Input
              id="faq-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="How do I install this on Cursor?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="faq-answer">Answer</Label>
            <Textarea
              id="faq-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Copy the install command from the Install Commands tab..."
              rows={4}
            />
          </div>
          {error && (
            <p className="text-sm text-accent-red">{error}</p>
          )}
          <Button onClick={addFaq} disabled={saving}>
            <Plus className="h-4 w-4 mr-2" />
            {saving ? "Adding..." : "Add FAQ"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {faqs.length === 0 ? (
          <Card className="glass">
            <CardContent className="py-10 text-center text-text-secondary">
              No FAQs yet. Add common buyer questions to reduce support load.
            </CardContent>
          </Card>
        ) : (
          faqs.map((faq) => (
            <Card key={faq.id} className="glass">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <GripVertical className="h-5 w-5 text-text-tertiary mt-1 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary">{faq.question}</p>
                    <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap">{faq.answer}</p>
                    <div className="flex items-center gap-3 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePublished(faq)}
                      >
                        {faq.published ? "Published" : "Draft"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteFaq(faq.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
