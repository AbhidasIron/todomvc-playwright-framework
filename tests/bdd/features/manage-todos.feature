@regression
Feature: Manage todos
  As a user
  I want to complete, edit, delete and filter my todos
  So that my list reflects what is left to do

  Background:
    Given I am on the TodoMVC app
    And I have the todos:
      | Buy milk       |
      | Walk the dog   |
      | Read a chapter |

  @smoke
  Scenario: Complete a todo
    When I complete the todo "Walk the dog"
    Then the todo "Walk the dog" should be completed
    And the counter should show "2 items left"

  Scenario: Edit a todo
    When I rename the todo "Buy milk" to "Buy oat milk"
    Then I should see the todos:
      | Buy oat milk   |
      | Walk the dog   |
      | Read a chapter |

  Scenario: Cancel editing with Escape
    When I start renaming "Buy milk" to "Ignored" and press Escape
    Then I should see the todos:
      | Buy milk       |
      | Walk the dog   |
      | Read a chapter |

  Scenario: Delete a todo
    When I delete the todo "Read a chapter"
    Then I should see the todos:
      | Buy milk     |
      | Walk the dog |

  Scenario: Clear completed todos
    When I complete the todo "Buy milk"
    And I clear completed todos
    Then I should see the todos:
      | Walk the dog   |
      | Read a chapter |

  Scenario: Todos persist after reload
    When I complete the todo "Buy milk"
    And I reload the page
    Then the todo "Buy milk" should be completed
    And I should see 3 todos

  Scenario Outline: Filter todos by "<filter>"
    When I complete the todo "Walk the dog"
    And I select the "<filter>" filter
    Then I should see <count> todos
    And the URL should end with "<route>"

    Examples:
      | filter    | count | route       |
      | All       | 3     | #/          |
      | Active    | 2     | #/active    |
      | Completed | 1     | #/completed |
